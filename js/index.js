// 文档加载完毕后执行
$(document).ready(function ()
{
    //根据屏幕大小计算字体大小
    const oHtml = document.getElementsByTagName('html')[0]
    const width = oHtml.clientWidth;
    var rootFontSize = 12 * (width / 1440);// 在1440px的屏幕基准像素为12px
    rootFontSize = rootFontSize <8 ? 8:rootFontSize;//最小为8px
    rootFontSize = rootFontSize >16 ? 16:rootFontSize;//最大为18px
    oHtml.style.fontSize = rootFontSize+ "px";
    //计算图片流宽度：根据屏幕宽度计算，最小显示2列
    if(width < 2*columnWidth){//如果屏幕不能并排2列，则调整图片宽度
        columnWidth = (width-columnMargin*4)/2;//由于每一个图片左右均留白，故2列有4个留白
    }
    var args = getQuery();//获取参数
    $('#waterfall').NewWaterfall({
        width: columnWidth,
        delay: 100,
    });
    category = args["category"]?args["category"]:0; //如果是跳转，需要获取当前目录
    if(args["classify"]){
        classify = args["classify"]; //如果指定标准类目，则根据标准类目过滤
        itemMetaCategory = args["classify"];
        classifyName = args["classifyName"]?args["classifyName"]:args["classify"]; //如果已指定类目名称则使用名称，否则直接显示ID     
    }   
    if(args["brokerId"]){//记录达人信息
        brokerId = args["brokerId"];
    }
    loadCategories(category);
    loadPlatforms(source);//加载电商平台列表
    showClassifyDiv();//显示状态选择栏

    $("#findAll").click(function(){//注册搜索事件：点击搜索全部
        tagging = $(".search input").val().trim();
        //window.location.href="index.html?keyword="+tagging;
        loadData();
    }); 

    //加载filter并高亮
    loadFilters(filter);    

    //设置提示信息：是否显示所有条目 showAllItems
    showAllItems = args["showAllItems"]?true:false;//传入该参数则显示全部内容
    if(showAllItems){
        $("#tipText").text("当前显示全部商品，请关闭自动入库功能");
        $('#tipText').css('color', 'red');
    }

    //判断是否是嵌入模式：hideHeaderBar
    hideHeaderBar = args["hideHeaderBar"]?true:false;
    if(hideHeaderBar){
        $(".header").css("display","none");
    }

});

var columnWidth = 300;//默认宽度300px
var columnMargin = 5;//默认留白5px

var brokerId = "";//记录达人信息

var loading = false;
var dist = 500;
var num = 1;//需要加载的内容下标

var items = [];//所有内容列表
var itemKeys = [];//记录itemKey列表，用于排重。服务器端存在重复数据
var category  = 0; //当前目录
var tagging = ""; //当前目录关联的查询关键词，搜索时直接通过该字段而不是category进行
var filter = "";//通过filter区分好价、好物、附近等不同查询组合

var categoryTagging = "";//记录目录切换标签，tagging = categoryTagging + currentPersonTagging

var source="all";//记录电商平台切换标签
var classify = "pending";//标志是否已经入库，如果为pending则为待入库，否则接收前端传入的标准类目ID
var classifyName = "待分类商品";//用于切换入库状态：未入库、已入库的则显示当前选中类目。从URL传入
var itemMetaCategory = "";//记录meta.category。由于当前界面展示过程中classify会被改变，此处另外记录


var hasMore = false;
var cursorId = null;

var showAllItems = false;
var hideHeaderBar = true;

setInterval(function ()
{
    if ($(window).scrollTop() >= $(document).height() - $(window).height() - dist && !loading)
    {
        // 表示开始加载
        loading = true;

        // 加载内容
        if(items.length < num){//如果内容未获取到本地则继续获取
            loadItems();
        }else{//否则使用本地内容填充
            insertItem();
        }
    }
}, 60);  

var page = {
    size:20,//每页条数
    total:1,//总页数
    current:-1//当前翻页
};

var sortByScore = { "_score":   { "order": "desc" }};
var sortByTimestamp = { "@timestamp":   { "order": "desc" }};

var sortByPrice = { "price.sale":   { "nested_path" : "price","order": "asc" }};
var sortByRank = { "rank.score":   { "nested_path" : "rank","order": "desc" }};
var sortByProfit = { "profit.order":   { "nested_path" : "profit","order": "desc" }};

var taggingBoolQueryPlatformTemplate = JSON.stringify({"match" : {"source": ""}});//在full_text字段搜索
var taggingBoolQueryTextTemplate = JSON.stringify({"match" : {"full_text": ""}});//在full_text字段搜索
var taggingBoolQueryTagsTemplate = JSON.stringify({"match" : {"full_tags": ""}});//在full_tags字段搜索
var taggingBoolQueryShouldTemplate = JSON.stringify({
    "bool" : {
           "should" : [],
          "minimum_should_match": 1
          }
     });
//组建 手动输入/用户标注/目录标注 查询。将加入MUST查询
function buildTaggingQuery(keyword){
    var q = JSON.parse(taggingBoolQueryShouldTemplate);
    //组织full_text查询
    var textTerm = JSON.parse(taggingBoolQueryTextTemplate);
    textTerm.match.full_text = keyword;
    q.bool.should.push(textTerm);
    //组织full_tags查询
    /*
    var textTags = JSON.parse(taggingBoolQueryTagsTemplate);
    textTags.match.full_tags = keyword;
    q.bool.should.push(textTags);
    //**/
    //返回组织好的bool查询
    return q;
}

//组建 将平台信息将加入MUST查询
function buildPlatformQuery(keyword){
    var q = JSON.parse(taggingBoolQueryShouldTemplate);
    //组织full_text查询
    var textTerm = JSON.parse(taggingBoolQueryPlatformTemplate);
    textTerm.match.source = keyword;
    q.bool.should.push(textTerm);
    //组织full_tags查询
    /*
    var textTags = JSON.parse(taggingBoolQueryTagsTemplate);
    textTags.match.full_tags = keyword;
    q.bool.should.push(textTags);
    //**/
    //返回组织好的bool查询
    return q;
}

//在有传入classify时，显示状态选择导航栏，只有两个选项：待入库类目、已选择类目
function showClassifyDiv(){
    var navObj = $("#classifyNav");
    var allText = "全部";
    var msg = [];
    msg.push({//所有待入库商品
                root:'0',
                name:allText,
                id:'all'
            });    
    msg.push({//所有待入库商品
                root:'0',
                name:'待入库',
                id:'pending'
            });
    msg.push({//当前选中商品
                root:'0',
                name:classifyName,
                id:classify
            });
    $("#classifyNavDiv").css("display","block");
    for(var i = 0 ; i < msg.length ; i++){
        navObj.append("<li data='"+msg[i].id+"' data-tagging='"+msg[i].id+"'  style='line-height:2rem;font-size:1.2rem'>"+msg[i].name+"</li>");
        if(classify == msg[i].id)//高亮显示当前选中的classify
            $(navObj.find("li")[i]).addClass("showNav");
    }
    //增加将当前界面所有商品统一加入classify分类按钮
    if(itemMetaCategory&&itemMetaCategory.trim().length>0&&itemMetaCategory!="all"){
        navObj.append("<span id='batchClassify' style='line-height:2rem;font-size:1.2rem;margin-right:0;color:blue;font-weight:bold;margin-left:10%;'>将所有条目都加入"+classifyName+"</span>");
        //注册点击事件
        $("#batchClassify").click(function(){//更新当前页面所有item列表的meta设置
            items.forEach(function(item){
                if(!item.meta)
                    item.meta = {};
                item.meta.category = itemMetaCategory;//注意，不能使用classify，界面在切换过程中会修改
                item.meta.categoryName = classifyName;
                submitItemForm(item);
                changePlatformCategoryMapping(item);
            });
        });
    }

    //注册点击事件
    navObj.find("li").click(function(){
        var key = $(this).attr("data");              
        if(key == classify){//如果是当前选中的再次点击则取消高亮，选择“全部”
            key = "all";
            classify = "all";
            changeClassify(key);//更换后更新内容
            $(navObj.find("li")).removeClass("showNav");
            $("#classifyNav>li:contains('"+allText+"')").addClass("showNav");
        }else{
            changeClassify(key);//更换后更新内容
            $(navObj.find("li")).removeClass("showNav");
            $(this).addClass("showNav");//不好，这个是直接通过“全部”来完成的                    
        }
    })    
}

//逐条更改item的meta信息：在批量修改是调用
var totalSubmitItems = 0;
function submitItemForm(item){
    var data = {
        records:[{
            value:item
        }]
    };
    $.ajax({
        url:"http://kafka-rest.shouxinjk.net/topics/stuff",
        type:"post",
        data:JSON.stringify(data),//注意：不能使用JSON对象
        headers:{
            "Content-Type":"application/vnd.kafka.json.v2+json",
            "Accept":"application/vnd.kafka.v2+json"
        },
        success:function(result){
            totalSubmitItems ++;
            console.log("submit item.[count]",totalSubmitItems);
            siiimpleToast.message('玩命提交中，'+totalSubmitItems+'/'+items.length,{
                  position: 'bottom|center'
                });            
        }
    })     
}
//修改商品类目设置：将所有来源的商品类目映射添加到类目映射表
function changePlatformCategoryMapping(item){
    var name = "";
    var names = [];
    if(Array.isArray(item.category)){
        name = item.category[item.category.length-1];
        names = item.category;
    }else if(item.category && item.category.trim().length>0){
        var array = item.category.split(" ");
        name = array[array.length-1];
        names = array;
    }
    var platform_category = {
        platform:item.source,
        name:name,
        categoryId:item.meta.category
    };
    console.log("try to commit platform category.",platform_category);
    $.ajax({
        url:"https://data.shouxinjk.net/ilife/a/mod/platformCategory/rest/mapping",
        type:"post",
        data:JSON.stringify(platform_category),//注意：不能使用JSON对象
        //data:data,
        headers:{
            "Content-Type":"application/json",
            "Accept": "application/json"
        },
        success:function(res){
            console.log("upsert success.",res);
        },
        error:function(){
            console.log("upsert failed.",platform_category);
        }
    }); 
}


function changeClassify(key){
    classify = key;//更改当前类目
    //categoryTagging = q;//使用当前category对应的查询更新查询字符串
    loadData();
}

//将标准类目信息加入MUST查询 classify
function buildClassifyQuery(complexQuery){
    //如果传入标准类目则根据：status.classify = ready && meta.category = 标准类目
    if(classify=='all'){
        console.log("build query without classify.");
    }else if(classify=='pending'){//默认情况直接查询待入库条目：status.classify = pending
        var classifyStatusPendingQuery = {
            "nested": {
                "path": "status",
                "query": {
                    "match": {
                        "status.classify": "pending"
                    }
                }
            }
        }          
        complexQuery.query.bool.filter.push(classifyStatusPendingQuery);//根据classify状态过滤
    }else{//根据输入的classify过滤
        console.log("build query by classify=ready.",classify);
        var metaCategoryQuery = {
            "nested": {
                "path": "meta",
                "query": {
                    "match": {
                        "meta.category": classify
                    }
                }
            }
        }; 
        complexQuery.query.bool.filter.push(metaCategoryQuery);//根据类目过滤
    }
}


//查询模板
var esQueryTemplate = JSON.stringify({
  "from": 0,
  "size": page.size,    
  "query":{
    "bool":{
      "must": [],       
      "must_not": [],                
      "filter": [],      
      "should":[]
    }
  },
  "sort": [
  /*
    { "_score":   { "order": "desc" }},
    { "@timestamp": { "order": "desc" }}
    //**/
  ]   
});

//根据价格高低计算得分：价格越高，得分越低
//注意：这里添加了数值检查，如果price.sale为0 则直接得分1
var funcQueryByPrice = {
    "nested": {
      "path": "price",
      "score_mode": "min", 
      "query": {
        "function_score": {
          "script_score": {
            "script": "_score * (doc['price.sale'].value==0?1:(2-doc['price.sale'].value/(doc['price.bid'].value==0?doc['price.sale'].value:doc['price.bid'].value)))"
          }
        }
      }
    }
  };

//根据评价计算得分：评分越高，得分越高
var funcQueryByRank = {
    "nested": {
      "path": "rank",
      "score_mode": "avg", 
      "query": {
        "function_score": {
          "script_score": {
            "script": "_score * (1+doc['rank.score'].value/(doc['rank.base'].value==0?5:doc['rank.base'].value))"
          }
        }
      }
    }
  };

//根据佣金高低计算得分：佣金越高，得分越高
var funcQueryByProfit =  {
    "nested": {
      "path": "profit",
      "score_mode": "min", 
      "query": {
        "function_score": {
          "script_score": {
            "script": "_score * doc['profit.amount'].value"
          }
        }
      }
    }
  };

//根据距离远近计算得分：离用户越近，得分越高
//默认中心点为成都天府广场
var funcQueryByDistance = {
    "function_score": {
        "functions": [
            {
              "gauss": {
                "location": { 
                      "origin": { "lat": 30.6570, "lon": 104.0650 },
                      "offset": "3km",
                      "scale":  "2km"
                }
              }
            }
        ],
        "boost_mode": "multiply"
    }
};

function highlightFilter(){
    if(filter=="byProfit"){
        $("#findByProfit").addClass("searchBtn-highlight");
    }else if(filter=="byPrice"){
        $("#findByPrice").addClass("searchBtn-highlight");
    }else if(filter=="byRank"){
        $("#findByRank").addClass("searchBtn-highlight");
    }else if(filter=="byDistance"){
        $("#findByDistance").addClass("searchBtn-highlight");
    }
}


//构建查询，包括排序类型、平台类型
function buildEsQuery(){
    var complexQuery = JSON.parse(esQueryTemplate);
    //添加must
    if(tagging && tagging.trim().length > 0){//手动输入搜索条件
        complexQuery.query.bool.must.push(buildTaggingQuery(tagging));
    }
    if(categoryTagging && categoryTagging.trim().length > 0){//目录标注
        complexQuery.query.bool.must.push(buildTaggingQuery(categoryTagging));
    }  
    if(source && source.trim().length > 0 && source.trim()!='all'){//根据平台过滤
        complexQuery.query.bool.must.push(buildPlatformQuery(source));
    }    

    buildClassifyQuery(complexQuery);//根据类目过滤：直接操作complexQuery

    console.log("es complexQuery",JSON.stringify(complexQuery));
    
    //TODO：添加must_not
    /*
    if(userInfo.tagging && userInfo.tagging.must_not){
        complexQuery.query.bool.must_not.push({match: { full_tags: userInfo.tagging.must_not.join(" ")}});
    }else if(persona.tagging && persona.tagging.must_not){
        complexQuery.query.bool.must_not.push({match: { full_tags: persona.tagging.must_not.join(" ")}});
    }else{
        console.log("no must_not");
    }*/
    //TODO：添加filter
    /*
    if(userInfo.tagging && userInfo.tagging.filter){
        complexQuery.query.bool.filter.push({match: { full_tags: userInfo.tagging.filter.join(" ")}});
    }else if(persona.tagging && persona.tagging.filter){
        complexQuery.query.bool.filter.push({match: { full_tags: persona.tagging.filter.join(" ")}});
    }else{
        console.log("no filter");
    }*/

    //添加排序规则：byRank/byPrice/byProfit/byDistance
    if(filter && filter.trim()=="byPrice"){//根据价格排序
        complexQuery.query.bool.should.push(funcQueryByPrice);
        //complexQuery.sort.push(sortByPrice);
    }else if(filter && filter.trim()=="byDistance"){//根据位置进行搜索。优先从用户信息中获取经纬度，否则请求获取得到当前用户经纬度
        //TODO 需要使用当前选中的用户进行设置：如果选中的是画像怎么办？？
        funcQueryByDistance.function_score.functions[0].gauss.location.origin.lat = app.globalData.userInfo.location.latitude;
        funcQueryByDistance.function_score.functions[0].gauss.location.origin.lon = app.globalData.userInfo.location.longitude;
        complexQuery.query.bool.should.push(funcQueryByDistance);
    }else if(filter && filter.trim()=="byProfit"){//根据佣金排序
        //complexQuery.query.bool.should.push(funcQueryByProfit);
        complexQuery.sort.push(sortByProfit);
    }else if(filter && filter.trim()=="byRank"){//根据评价排序
        //complexQuery.query.bool.should.push(funcQueryByRank);
        complexQuery.sort.push(sortByRank);
    }else{
        //do nothing
        console.log("Unsupport filter type.[filter]",filter);
    }

    //默认根据得分及时间排序
    complexQuery.sort.push(sortByScore);
    complexQuery.sort.push(sortByTimestamp);

    //TODO 添加vals
    //TODO 添加cost
    //TODO 添加satisify

    //返回query
    return complexQuery;
}

//默认查询。将通过buildEsQuery()进行校正
var esQuery={
    from:0,
    size:page.size,
    query: {
        match_all: {}
    },
    sort: [
        { "@timestamp": { order: "desc" }},
        { "_score":   { order: "desc" }}
    ]
};

/*
function loadItems(){//获取内容列表
    $.ajax({
        url:"https://data.shouxinjk.net/_db/sea/my/stuff",
        type:"get",
        data:{offset:items.length,size:20,category:category},
        success:function(data){
            if(data.length==0){//如果没有内容，则显示提示文字
                showNoMoreMsg();
            }else{
                for(var i = 0 ; i < data.length ; i++){
                    items.push(data[i]);
                }
                insertItem();
            }
        }
    })            
}

//直接从arangodb查询结果：效率太低，废弃。
function loadItems(){//获取内容列表
    //query by aql: 选取tagging为空，并且已经有cps链接或qrcode的条目
    var url = 'https://data.shouxinjk.net/_db/sea/_api/cursor';
    var q={
        //query: "For doc in my_stuff filter doc.tagging==null and (doc.link.web2!=null or doc.link.qrcode!=null) sort doc.task.timestamp desc return doc", 
        query: "For doc in my_stuff filter doc.status.classify=='pending' and doc.status.sync=='ready' sort doc.task.timestamp desc return doc", 
        count:  true,
        batchSize: 10//默认显示10条
    };    
    if (showAllItems) {//如果显示所有则提示全部内容
        //q.query = "For doc in my_stuff filter doc.tagging==null sort doc.task.timestamp desc return doc";
        q.query = "For doc in my_stuff filter doc.status.classify=='pending' sort doc.task.timestamp desc return doc";
    }     
    $.ajax({
        url:url,
        type:"POST",
        data:JSON.stringify(q),
        headers:{
            "Content-Type":"application/json",
            "Authorization":"Basic aWxpZmU6aWxpZmU="
        },
        success:function(data){
            //记录游标信息
            hasMore = data.hasMore;
            if(data.hasMore){
                cursorId = data.id;
            }else{
                cursorId = null;
            }
            //处理数据列表
            if(data.result.length==0){//如果没有内容，则显示提示文字
                showNoMoreMsg();
            }else{
                for(var i = 0 ; i < data.result.length ; i++){
                    items.push(data.result[i]);
                }
                insertItem();
            }
        }
    })            
}
//*/

//直接从搜索引擎获取商品条目
function loadItems(){//获取内容列表
    //构建esQuery
    esQuery = buildEsQuery();//完成query构建。其中默认设置了每页条数
    //处理翻页
    esQuery.from = (page.current+1) * page.size;
    console.log("\ntry search by query.[esQuery]",esQuery,"\n");
    $.ajax({
        url:"https://data.pcitech.cn/stuff/_search",
        type:"post",
        data:JSON.stringify(esQuery),//注意：nginx启用CORS配置后不能直接通过JSON对象传值
        headers:{
            "Content-Type":"application/json",
            "Authorization":"Basic ZWxhc3RpYzpjaGFuZ2VtZQ=="
        },
        crossDomain: true,
        timeout:3000,//设置超时
        success:function(data){
            console.log("got result",data);
            if(data.hits.total == 0 || data.hits.hits.length == 0){//如果没有内容，则显示提示文字
                console.log("no more results. show no more button.");
                shownomore(true);
            }else{
                //更新总页数
                var total = data.hits.total;
                page.total = (total + page.size - 1) / page.size;
                //更新当前翻页
                page.current = page.current + 1;
                //装载具体条目
                var hits = data.hits.hits;
                for(var i = 0 ; i < hits.length ; i++){
                    if(itemKeys.indexOf(hits[i]._source._key)<0){
                      itemKeys.push(hits[i]._source._key);
                      items.push(hits[i]._source);
                    }                    
                }
                insertItem();
            }
        },
        complete: function (XMLHttpRequest, textStatus) {//调用执行后调用的函数
            if(textStatus == 'timeout'){//如果是超时，则显示更多按钮
              console.log("ajax超时",textStatus);
              shownomore(true);
            }
        },
        error: function () {//调用出错执行的函数
            //请求出错处理：超时则直接显示搜索更多按钮
            shownomore(true);
          }

    })
}


/**
//从cursor中获取数据，用于分页显示
function loadMore(){
    //query by aql: 选取tagging为空，并且已经有cps链接或qrcode的条目
    var url = 'https://data.shouxinjk.net/_db/sea/_api/cursor/'+cursorId;
    var q={};     
    $.ajax({
        url:url,
        type:"PUT",
        data:JSON.stringify(q),
        headers:{
            "Content-Type":"application/json",
            "Authorization":"Basic aWxpZmU6aWxpZmU="
        },
        success:function(data){
            //记录游标信息
            hasMore = data.hasMore;
            if(data.hasMore){
                cursorId = data.id;
            }else{
                cursorId = null;
            }
            //处理数据列表            
            if(data.result.length==0){//如果没有内容，则显示提示文字
                showNoMoreMsg();
            }else{
                for(var i = 0 ; i < data.result.length ; i++){
                    items.push(data.result[i]);
                }
                insertItem();
            }
        }
    })      
}
//**/

//将item显示到页面
function insertItem(){
    // 加载内容
    var item = items[num-1];
    var imgWidth = columnWidth-2*columnMargin;//注意：改尺寸需要根据宽度及留白计算，例如宽度为360，左右留白5，故宽度为350
    var imgHeight = random(50, 300);//随机指定初始值
    //计算图片高度
    var img = new Image();
    img.src = item.images[0];
    var orgWidth = img.width;
    var orgHeight = img.height;
    imgHeight = orgHeight/orgWidth*imgWidth;
    //计算文字高度：按照1倍行距计算
    //console.log("orgwidth:"+orgWidth+"orgHeight:"+orgHeight+"width:"+imgWidth+"height:"+imgHeight);
    var image = "<img src='"+item.images[0]+"' width='"+imgWidth+"' height='"+imgHeight+"'/>"
    //var title = "<span class='title'><a href='info.html?category="+category+"&id="+item._key+"'>"+item.title+"</a></span>"
    var metaCategory = "";
    if(item.meta&&item.meta.categoryName){
        metaCategory = "<div class='title'>"+item.meta.categoryName+"</div>"
    }
    var title = "<div class='title'>"+item.distributor.name+" "+item.title+"</div>"
    $("#waterfall").append("<li><div data='"+item._key+"'>" + image + metaCategory +title+ "</div></li>");
    num++;

    //注册事件
    $("div[data='"+item._key+"']").click(function(){
        //跳转到详情页
        window.location.href = "info.html?category="+category+"&id="+item._key+"&brokerId="+brokerId+(showAllItems?"&showAllItems=true":"")+(hideHeaderBar?"&hideHeaderBar=true":"");
    });

    // 表示加载结束
    loading = false;
}

//当没有更多item时显示提示信息
function showNoMoreMsg(){
    //todo：显示没有更多
}

// 自动加载更多：此处用于测试，动态调整图片高度
function random(min, max)
{
    return min + Math.floor(Math.random() * (max - min + 1))
}

//显示没有更多内容
function shownomore(flag){
  //检查是否是一条数据都没加载
  if(items.length==0){//需要特别处理：如果没有任何数据，则需要默认设置，否则导致无法显示show more btn
    $("#waterfall").height(10);
    $("#no-results-tip").toggleClass("no-result-tip-hide",false);
    $("#no-results-tip").toggleClass("no-result-tip-show",true);
  }  
  if(flag){
    $("#findMoreBtn").toggleClass("findMoreBtn-hide",false);
    $("#findMoreBtn").toggleClass("findMoreBtn-show",true);
    //注册跳转事件：在某些情况下，搜索不到，直接回到首页，不带参数搜索
    $("#findMoreBtn").click(function(){
      window.location.href = "index.html";
    });    
  }else{
    $("#findMoreBtn").toggleClass("findMoreBtn-hide",true);
    $("#findMoreBtn").toggleClass("findMoreBtn-show",false);
  }
}


function getLocation(){
    $.ajax({
        url:app.config.auth_api+"/wechat/jssdk/ticket",
        type:"get",
        data:{url:window.location.href},//重要：获取jssdk ticket的URL必须和浏览器浏览地址保持一致！！
        success:function(json){
            console.log("===got jssdk ticket===\n",json);
            wx.config({
                debug:false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                appId: json.appId, // 必填，公众号的唯一标识
                timestamp:json.timestamp , // 必填，生成签名的时间戳
                nonceStr: json.nonceStr, // 必填，生成签名的随机串
                signature: json.signature,// 必填，签名
                jsApiList: [
                  'getLocation',
                  'updateTimelineShareData',
                  'onMenuShareAppMessage',
                  'onMenuShareTimeline',
                  "onMenuShareTimeline",
                  'onMenuShareAppMessage'                   
                ] // 必填，需要使用的JS接口列表
            });
            wx.ready(function() {
                // config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，
                // 则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
                //获取当前用户地理位置
                wx.getLocation({
                  type: 'gcj02', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'. gcj02可以用高德进行验证
                  success: function (res) {
                    console.log("\n-----got current location-----\n",res);
                    var latitude = res.latitude; // 纬度，浮点数，范围为90 ~ -90
                    var longitude = res.longitude; // 经度，浮点数，范围为180 ~ -180。
                    var speed = res.speed; // 速度，以米/每秒计
                    var accuracy = res.accuracy; // 位置精度
                    //通过百度转换为统一坐标系
                    //convertToBaiduLocation(longitude,latitude,callback);//这个有跨域问题，不能直接通过ajax请求访问
                    var baiduApi = "https://api.map.baidu.com/geoconv/v1/?coords="+longitude+","+latitude
                                    +"&from=3&to=5&ak=XwNTgTOf5mYaZYhQ0OiIb6GmOHsSZWul&callback=getCorsCoordinate";
                    jQuery.getScript(baiduApi);//注意：不能通过ajax请求，而只能通过脚本加载绕过跨域问题
                  }
                });
                //end
            });
        }
    })    
}


function getCorsCoordinate(data){
    console.log("\n\ngot converted location.",data);
    if(data.status==0&&data.result.length>0){//表示成功:更新到用户地址
        var location = {
            longitude:data.result[0].x,
            latitude:data.result[0].y
        };
        app.globalData.userInfo.location = location;
        //设置本地UserInfo：存储到cookie
        $.cookie('sxUserInfo', JSON.stringify(app.globalData.userInfo), { expires: 3650, path: '/' });
        //推送到用户
        util.AJAX(app.config.data_api +"/user/users/"+app.globalData.userInfo.openId, function (res) {
            if (app.globalData.isDebug) console.log("Index::convertToBaiduLocation update person location finished.", res);
            //重新加载数据
            loadData();
            //直接开始搜索
            //window.location.href="index.html?filter=byDistance&keyword="+tagging+"&personTagging="+currentPersonTagging+"&categoryTagging="+categoryTagging+"&category="+category+"&id="+currentPerson;
        }, "PATCH", app.globalData.userInfo, { "Api-Key": "foobar" });
    }else{
        console.log("\n\nfailed convert location.",data);
    }
}

function loadFilters(currentFilter){
    var filterTypes = ["Profit","Price","Rank","Distance"];//filter类型
    for(var i = 0 ; i < filterTypes.length ; i++){//已经在界面显示，此处仅注册点击事件
        if(currentFilter == filterTypes[i]){//高亮显示当前选中的filter
            filter = currentFilter;
            $("#findBy"+filterTypes[i]).addClass("searchBtn-highlight");
        }
        //注册点击事件
        $("#findBy"+filterTypes[i]).click(function(){
            var key = "by"+$(this).attr("data"); 
            console.log("filter changed.[current]"+filter+"[new]"+key);
            $("a[id^='findBy']").each(function(){//删除所有高亮
                $(this).removeClass("searchBtn-highlight");
            });                         
            if(key == filter){//如果是当前选中的再次点击则取消高亮，选择“全部”
                changeFilter("");//取消当前选中
            }else{
                changeFilter(key);//更换后更新内容
                $(this).addClass("searchBtn-highlight");                 
            }
        })
    }
}

function changeFilter(currentFilter){
    filter = currentFilter;//使用当前选中的filter
    if(filter == "byDistance"){//获取地址然后重新加载数据
      getLocation();//点击后请求授权，并且在授权后每次点击时获取当前位置，并开始搜索
    }else{
      loadData();
    }
}

function loadCategories(currentCategory){
    $.ajax({
        url:app.config.sx_api+"/mod/channel/rest/channels/active",
        type:"get",
        success:function(msg){
            var navObj = $("#categoryNav");
            for(var i = 0 ; i < msg.length ; i++){
                navObj.append("<li data='"+msg[i].id+"' data-tagging='"+(msg[i].tagging?msg[i].tagging:"")+"'>"+msg[i].name+"</li>");
                if(currentCategory == msg[i].id){//高亮显示当前选中的category
                    $(navObj.find("li")[i]).addClass("showNav");
                    tagging = msg[i].tagging;
                }
            }
            //注册点击事件
            navObj.find("li").click(function(){
                var key = $(this).attr("data");
                var tagging = $(this).attr("data-tagging");                
                if(key == category){//如果是当前选中的再次点击则取消高亮，选择“全部”
                    key = "all";
                    tagging = "";
                    changeCategory(key,tagging);//更换后更新内容
                    $(navObj.find("li")).removeClass("showNav");
                    $("#categoryNav>li:contains('全部')").addClass("showNav");
                }else{
                    changeCategory(key,tagging);//更换后更新内容
                    $(navObj.find("li")).removeClass("showNav");
                    $(this).addClass("showNav");//不好，这个是直接通过“全部”来完成的                    
                }
            })
        }
    })    
}

function changeCategory(key,q){
    category = key;//更改当前category
    categoryTagging = q;//使用当前category对应的查询更新查询字符串
    loadData();
}

//加载顶部导航栏，用于切换不同的电商平台
function loadPlatforms(currentPlatform){
    $.ajax({
        url:"http://www.shouxinjk.net/ilife/a/mod/itemCategory/third-party-platforms",
        type:"get",
        success:function(msg){
            console.log("got platforms.",msg);
            var navObj = $("#platformNav");
            //将全部平台作为第一项         
            var all={
                root:'0',
                name:'不限',
                id:'all'
            };
            msg.unshift(all);//加到头部
            for(var i = 0 ; i < msg.length ; i++){
                navObj.append("<li data='"+msg[i].id+"' data-tagging='"+msg[i].id+"' style='line-height:2rem;font-size:1.2rem'>"+msg[i].name+"</li>");
                if(currentPlatform == msg[i].id)//高亮显示当前选中的platform
                    $(navObj.find("li")[i]).addClass("showNav");
            }
            //注册点击事件
            navObj.find("li").click(function(){
                var key = $(this).attr("data");              
                if(key == category){//如果是当前选中的再次点击则取消高亮，选择“全部”
                    key = "all";
                    tagging = "";
                    changePlatform(key);//更换后更新内容
                    $(navObj.find("li")).removeClass("showNav");
                    $("#platformNav>li:contains('全部')").addClass("showNav");
                }else{
                    changePlatform(key);//更换后更新内容
                    $(navObj.find("li")).removeClass("showNav");
                    $(this).addClass("showNav");//不好，这个是直接通过“全部”来完成的                    
                }
            })
        }
    })    
}

function changePlatform(key){
    source = key;//更改当前platform
    //categoryTagging = q;//使用当前category对应的查询更新查询字符串
    loadData();
}



function loadData(){
    items = [];//清空列表
    itemKeys = [];//同步清空itemKey列表
    $("#waterfall").empty();//清除页面元素
    num=1;//设置加载内容从第一条开始
    page.current = -1;//设置浏览页面为未开始
    console.log("query by tagging.[categoryTagging]"+categoryTagging+"[tagging]"+tagging+"[platform]"+source+"[filter]"+filter);
    loadItems();//重新加载数据
}

