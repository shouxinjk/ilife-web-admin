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
        width: width*0.9,
        delay: 100,
    });

    loadActionTypes();//加载action类型列表
    loadPlatforms();//加载电商平台列表

    $("#findAll").click(function(){//注册搜索事件：点击搜索全部
        //window.location.href="index.html?keyword="+tagging;
        loadData();
    }); 

    //显示开始时间
    $( "#startTime" ).datepicker();
    $( "#startTime" ).datepicker( "option", "dateFormat", "yy-mm-dd");
    $( "#endTime" ).datepicker();
    $( "#endTime" ).datepicker( "option", "dateFormat", "yy-mm-dd");

    //判断是否是嵌入模式：hideHeaderBar
    hideHeaderBar = args["hideHeaderBar"]?true:false;
    if(hideHeaderBar){
        $(".header").css("display","none");
    }

});

var columnWidth = 300;//默认宽度300px
var columnMargin = 5;//默认留白5px

var loading = false;
var dist = 500;
var num = 1;//需要加载的内容下标

var items = [];//所有内容列表
var itemKeys = [];//记录itemKey列表，用于排重。服务器端存在重复数据

var hasMore = false;
var hideHeaderBar = true;

var actionTypes = {
  view:"看了",
  share:"分享",
  "publish":"发布",
  "collect":"上架",  
  "share poster":"海报分享",
  "share board poster":"清单海报分享",
  "share appmsg":"微信分享",
  "share timeline":"朋友圈分享",
  "buy step1":"很感兴趣",
  "buy step2":"准备剁手",
  buy:"拔草",
  favorite:"种草",
  like:"喜欢"
};

var platforms = {};//缓存所有平台key及名称

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
    { "@timestamp": { order: "desc" }},
    { "_score":   { order: "desc" }}
  ]   
});


//构建查询，包括排序类型、平台类型
function buildEsQuery(){
    var complexQuery = JSON.parse(esQueryTemplate);
    //检查关键词
    var tagging = $("#fullText").val().trim();
    if(tagging && tagging.trim().length > 0){//手动输入搜索条件
        complexQuery.query.bool.must.push({"match" : {"full_text": tagging}});        
    }    
    //检查source，支持多个：注意，是加入must，在所有should中满足一个即可
    var platformShould = {"bool" : {
            "should" : [],
            "minimum_should_match": 1
        }
    };   
    $('input[id^=platform-]:checked').each(function(){
        console.log("got checked platform.[value]"+$(this).val());     
        platformShould.bool.should.push({
            "nested": {
                "path": "item",
                "query": {
                    "match": {
                        "item.source": $(this).val()
                    }
                }
            }
        });        
    });
    complexQuery.query.bool.must.push(platformShould);
    //检查actionType，支持多个：注意，是加入must，在所有should中满足一个即可
    var actionTypeShould = {"bool" : {
            "should" : [],
            "minimum_should_match": 1
        }
    };       
    $('input[id^=actiontype-]:checked').each(function(){
        console.log("got checked action type.[value]"+$(this).val());
        actionTypeShould.bool.should.push({"match" : {"action": $(this).val()}});      
    });    
    complexQuery.query.bool.must.push(actionTypeShould);
    //检查用户昵称
    var nickName = $("#nickName").val().trim();
    if(nickName && nickName.trim().length > 0){
        complexQuery.query.bool.filter.push({
            "nested": {
                "path": "user",
                "query": {
                    "match": {
                        "user.nickName": nickName
                    }
                }
            }
        });
    }     
    //检查开始时间
    var startTime = $("#startTime").val().trim();
    if(startTime && startTime.trim().length > 0){
        complexQuery.query.bool.filter.push({
          "range": {
            "@timestamp" : {
              "gte" : startTime,
              "format": "yyyy-MM-dd||yyyy"
            }
          }
        });
    }     
    //检查结束时间
    var endTime = $("#endTime").val().trim();
    if(endTime && endTime.trim().length > 0){
        complexQuery.query.bool.filter.push({
          "range": {
            "@timestamp" : {
              "lte" : endTime,
              "format": "yyyy-MM-dd||yyyy"
            }
          }
        });
    }      
    console.log("es complexQuery",JSON.stringify(complexQuery));
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

//直接从搜索引擎获取商品条目
function loadItems(){//获取内容列表
    //构建esQuery
    esQuery = buildEsQuery();//完成query构建。其中默认设置了每页条数
    //处理翻页
    esQuery.from = (page.current+1) * page.size;
    console.log("\ntry search by query.[esQuery]",esQuery,"\n");
    $.ajax({
        url:"https://data.pcitech.cn/actions/_search",
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
                    //if(itemKeys.indexOf(hits[i]._source._key)<0){
                    //  itemKeys.push(hits[i]._source._key);
                      items.push(hits[i]._source);
                    //}                    
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

//将item显示到页面
function insertItem(){
    // 加载内容
    var item = items[num-1];
    if(!item){
        shownomore();
        return;
    }

    var html = "";
    html += "<div class='sxColumn "+(num%2==1?'sxColumn-grey':'')+"' style='width:10%'>"+new Date(item.timestamp).toISOString().slice(0, 19).replace("T"," ")+"</div>"
    html += "<div class='sxColumn "+(num%2==1?'sxColumn-grey':'')+"' style='width:10%'>"+item.user.nickName+"</div>"
    html += "<div class='sxColumn "+(num%2==1?'sxColumn-grey':'')+"' style='width:5%'>"+actionTypes[item.action]+"</div>"
    html += "<div class='sxColumn "+(num%2==1?'sxColumn-grey':'')+"' style='width:60%'>"+item.item.title+"</div>"
    html += "<div class='sxColumn "+(num%2==1?'sxColumn-grey':'')+"' style='width:5%'>"+(item.item.price.currency?item.item.price.currency:'￥')+item.item.price.sale+"</div>"
    html += "<div class='sxColumn "+(num%2==1?'sxColumn-grey':'')+"' style='width:5%'>"+platforms[item.item.source]+"</div>"
    html += "<div class='sxColumn "+(num%2==1?'sxColumn-grey':'')+"' style='width:5%'>"+(item.item.meta&&item.item.meta.categoryName?item.item.meta.categoryName:'')+"</div>"
    $("#waterfall").append("<li class='"+(num%2==1?'sxColumn-grey':'')+"'><div  class='sxRow "+(num%2==1?'sxColumn-grey':'')+"'>" + html+ "</div></li>");
    num++;

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

//加载所有支持的电商平台
function loadPlatforms(){
    $.ajax({
        url:"http://www.shouxinjk.net/ilife/a/mod/itemCategory/third-party-platforms",
        type:"get",
        success:function(msg){
            console.log("got platforms.",msg);
            for(var i = 0 ; i < msg.length ; i++){
                platforms[msg[i].id]=msg[i].name;
                $("#platformDiv").append("<div class='checkbox'><input type='checkbox' name='platform' id='platform-"+msg[i].id+"' value='"+msg[i].id+"'/><label for='platform-"+msg[i].id+"'>"+msg[i].name+"</label></div>");
            }
        }
    })    
}

//加载所有操作类型
function loadActionTypes(){
    var index = 0;
    for (var key in actionTypes) {
        console.log(key+ " " + actionTypes[key]);
        $("#actionTypeDiv").append("<div class='checkbox'><input type='checkbox' name='platform' id='actiontype-"+index+"' value='"+key+"'/><label for='actiontype-"+index+"'>"+actionTypes[key]+"</label></div>");
        index++;
    }  
}

function loadData(){
    items = [];//清空列表
    itemKeys = [];//同步清空itemKey列表
    $("#waterfall").empty();//清除页面元素
    num=1;//设置加载内容从第一条开始
    page.current = -1;//设置浏览页面为未开始
    loadItems();//重新加载数据
}

