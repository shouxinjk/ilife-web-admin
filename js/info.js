// 文档加载完毕后执行
$(document).ready(function ()
{
    //百度地图
    window.BMap_loadScriptTime = (new Date).getTime();
    //根据屏幕大小计算字体大小
    const oHtml = document.getElementsByTagName('html')[0]
    const width = oHtml.clientWidth;
    var rootFontSize = 12 * (width / 1440);// 在1440px的屏幕基准像素为12px
    rootFontSize = rootFontSize <8 ? 8:rootFontSize;//最小为8px
    oHtml.style.fontSize = rootFontSize+ "px";
    //设置正文部分宽度
    var bodyWidth = width*0.9;//960*width/1440; //1440分辨率下显示960宽度
    $("#body").width(bodyWidth);
    galleryWidth = bodyWidth*0.7;//占比70%，960下宽度为672
    galleryHeight = 9*galleryWidth/16;//宽高比为16:9
    $("#main").width(galleryWidth);
    //处理参数
    var args = getQuery();
    var category = args["category"]; //当前目录
    var id = args["id"];//当前内容
    showAllItems = args["showAllItems"]?true:false;//传入该参数表示需要index页面显示全部内容
    //判断屏幕大小，如果是小屏则跳转
    /**
    if(width<800){
        window.location.href=window.location.href.replace(/info.html/g,"info2.html");
    }
    //**/

    //加载地图
    /**
    map = new BMap.Map("allmap");
    var point = new BMap.Point(104.069376,30.574828);
    map.centerAndZoom(point,12); 
    //**/

    //加载导航和内容
    loadNavigationCategories(category);
    loadItem(id);   
    //loadHosts(id);//管理页面不需要加载关注列表

    //判断是否是嵌入模式：hideHeaderBar
    hideHeaderBar = args["hideHeaderBar"]?true:false;
    if(hideHeaderBar){
        $(".header").css("display","none");
    }

});

var _sxdebug = true;

var hideHeaderBar = true;
var showAllItems = false;
var map = null;

var galleryWidth = 673;
var galleryHeight = 378;

//当前条目
var stuff = {};

//融合后的属性key-value列表
var nodes = [];

//准备并加载ItemCategory
var itemCategory = {
    category:"",
    categoryId:"",
    props:[],
    keys:[],
    values:[]
};

var itemCategoryNew = {
    category:null,
    categoryId:null,
    keys:[]
};

//支持的类目
var categories = [];
var cascader = null;//级联选择器实例

//将item显示到页面
function showContent(item){
    //左侧：
    //标题与摘要
    $("#content").append("<div class='title'><a id='jumplink' href='#'>"+item.title+"</a></div>");//标题
    if(item.summary && item.summary.length>0)$("#content").append("<div class='summary'>"+item.summary+"</div>");//摘要
    // 标签
    //正文及图片
    for(var i=0;i<item.images.length;i++){
        $("#gallery").append("<li><img src='" + item.images[i] + "' alt=''/></li>");//加载图片幻灯
        $("#content").append("<img src='" + item.images[i] + "'/>");//正文图片
    }

    //初始化图片幻灯
    $('#gallery').galleryView({
        panel_width: galleryWidth,
        panel_height: galleryHeight,
        frame_width: 80,
        frame_height: 60
    }); 

    //右侧：
    //摘要：价格：优惠价与原价/评分/评价数；匹配度指数

    //购买按钮
    /*
    if(item.distributor && item.distributor.images && item.distributor.images.length>0)$("#shopping .summary").append("<img src='"+item.distributor.images[0]+"'/>");
    if(item.seller && item.seller.images && item.seller.images.length>0)$("#shopping .summary").append("<img src='"+item.seller.images[0]+"'/>");
    if(item.producer && item.producer.images && item.producer.images.length>0)$("#shopping .summary").append("<img src='"+item.producer.images[0]+"'/>");
    //*/
    $("#jumplink").click(function(){jump(item);}); 
    $("#jumpbtn").click(function(){jump(item);});   
    $("#title").click(function(){jump(item);}); 
    $("#indexbtn").click(function(){
        //根据填写结果组织property
        var props = [];
        for(var k in nodes){
            var node = nodes[k];
            var key = node.property;
            var prop = {};
            prop[key] = node.value;
            props.push(prop);
        }
        item.props = props;
        //更新ItemCategory
        if(itemCategoryNew.categoryId){
            item.categoryId = itemCategoryNew.categoryId;
            item.category = itemCategoryNew.category;
        }
        //检查并更新经纬度
        //item.address = $("#address").val()?$("#address").val():"珠穆朗玛峰";
        var lon = $("#lon").val()?$("#lon").val():"86.9250";
        var lat = $("#lat").val()?$("#lat").val():"27.9881";
        item.location = {
            lat:parseFloat(lat),
            lon:parseFloat(lon)
        };

        //标签和链接
        var tagging = $("#tagging").val()?$("#tagging").val():"";
        var web2link = $("#web2link").val()?$("#web2link").val():"";
        var wap2link = $("#wap2link").val()?$("#wap2link").val():"";
        if(stuff.meta && stuff.meta.category && tagging.trim().length>0 && ((web2link.trim().length>0 && wap2link.trim().length>0) || item.link.qrcode)) {
            stuff.tagging = tagging;
            stuff.link.web2 = web2link;
            stuff.link.wap2 = wap2link;
            stuff.task.status = "indexed";
            stuff.status.load = "pending";//提交后需要重新分析
            stuff.status.index = "pending";//提交后需要重新索引

            //先更新数据
            batchUpdateStuffCategory(stuff);//根据当前设置批量修改其他同类目stuff
            batchUpdatePlatformCategories(stuff);//根据当前设置批量修改其他同类目platform_categories

            //然后索引
            console.log("now start commit index.",stuff);
            index(stuff);
        }else{
            $.toast({
                heading: 'Error',
                text: '类目、推荐语和推广链接不能为空',
                showHideTransition: 'fade',
                icon: 'error'
            })
        }
    }); 
    //删除按钮：点击后更改状态：inactive
    $("#cancelbtn").click(function(){
        stuff.status.inactive = "inactive";
        stuff.status.index = "pending";//提交后需要重新索引
        stuff.timestamp.inactive = new Date();//更新时间戳
        index(stuff);
    });     
    //手工标注
    $("#tagging").val(item.tagging?item.tagging:"");  
    //pc推广链接
    $("#web2link").val(item.link.web2?item.link.web2:item.link.web);  
    //移动端推广链接 
    //标题
    $("#title").html(item.title);
    $("#wap2link").val(item.link.wap2?item.link.wap2:item.link.wap);  
    //地址
    /**
    $("#changeAddressBtn").click(//修改地址
        function(){
            var addr = $("#address").val();
            if(addr==null || addr.trim().length==0){//地址不能为空
                $.toast({
                    heading: 'Error',
                    text: '地址为空，不能获取坐标信息',
                    showHideTransition: 'fade',
                    icon: 'error'
                });
            }else{            
                item.address = addr;//更改显示内容；
                //解析地址得到经纬度
                getLocationByAddress(addr);
            }
        }
    );     
    //属性标注
    $("#changePropertyBtn").click(//提交属性值
        function(){
            console.log("待提交属性值：",nodes);
        }
    );   
    //**/  
    //评分
    if(item.rank && item.rank.score){
        $("#score .comment").append("<div class='label'>评价</div><div class='rank'>"+item.rank.score+"/<span class='base'>"+item.rank.base+"</span></div>");
    }else{
        $("#score .comment").append("<div class='label'>评价</div><div class='rank'><span class='empty'>暂无评分</span></div>");
    }
    $("#score .price").append("<div class='label'>"+(item.price.currency?item.price.currency:"价格")+"</div><div class='price-sale'><span class='price-bid'>"+(item.price.bid?item.price.bid:"")+"</span>"+item.price.sale+"</div>");
    //$("#score .price").append("<div class='label'>价格</div><div class='price-sale'>"+item.price.sale+"</div>");
    $("#score .score").append("<div class='label'>推荐度</div><div class='match'>"+(item.rank&&item.rank.match?item.rank.match*100+"%":"-")+"</div>");
    //二维码：使用海报图，将其中二维码进行裁剪
    if(item.link.qrcode){
        $("#qrcodeImg").attr("src",item.link.qrcode);
        $('#qrcodeImg').addClass('qrcode-'+item.source);//应用对应不同source的二维码裁剪属性
        $('#qrcodeImgDiv').addClass('qrcode-'+item.source+'-div');//应用对应不同source的二维码裁剪属性
        $("#qrcodeImgDiv").css('visibility', 'visible');
        $("#jumpbtn").text('扫码查看');
    }
    //推荐者列表
    //标签云
    if(item.distributor && item.distributor.name){//来源作为标签
        $("#tags").append("<div class='tag'>"+item.distributor.name+"</div>");
    }
    for(var i=0;item.tags && i<item.tags.length;i++){
        $("#tags").append("<div class='tag'>" + item.tags[i] + "</div>");
    } 

    //加载类目
    loadCategories();//显示类目选择器

    //显示标签列表，如果为空则用默认tags
    /**
    var tags = stuff.tags?stuff.tags:[];
    if(stuff.tagging && stuff.tagging.trim().length>0)
        tags = stuff.tagging.trim().split(" ")
    showTagging(tags);     
    //**/ 

    //随机着色
    /*
    $("#tags").find("div").each(function(){
        var rgb = Math.floor(Math.random()*(2<<23));
        var bgColor = '#'+rgb.toString(16);
        var color= '#'+(0xFFFFFF-rgb).toString(16);
        $(this).css({"background-color":bgColor,"color":color});
    });
    //*/
    //广告
    //TODO
}

/**
根据地址解析得到经纬度
*/
function getLocationByAddress(address){
    if(address==null || address.trim().length==0){//地址不能为空
        $.toast({
            heading: 'Error',
            text: '地址为空，不能获取坐标信息',
            showHideTransition: 'fade',
            icon: 'error'
        });
        return;
    }
   
    // 创建地址解析器实例
    var myGeo = new BMap.Geocoder();
    // 将地址解析结果显示在地图上,并调整地图视野
    myGeo.getPoint(address, function(point){
        if (point) {
            $("#lat").val(point.lat);
            $("#lon").val(point.lng);
            map.centerAndZoom(point, 16);
            map.addOverlay(new BMap.Marker(point));
        }else{
            $.toast({
                heading: 'Error',
                text: '不能获取与地址相对应的坐标',
                showHideTransition: 'fade',
                icon: 'error'
            });
        }
    }, "成都市");
}

//提交索引
function index(item){//记录日志
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
            //fn(result);
            $.toast({
                heading: 'Success',
                text: '更新成功',
                showHideTransition: 'fade',
                icon: 'success'
            });
            goNextItem();
        }
    })            
}

var pendingCount=3;//等待最后一个异步调用返回才跳转
function goNextItem(){
    pendingCount--
    console.log("pending jump to next page. pending requests = ",pendingCount);
    if(pendingCount < 2)//更新stuff较慢，不等待，直接跳转
        window.location.href="index.html?from=web"+(showAllItems?"&showAllItems=true":"")+(hideHeaderBar?"&hideHeaderBar=true":"");
}


//批量修改my_stuff
//将my_stuff中classify=pending,且source、category与当前stuff相同的同时修改
function batchUpdateStuffCategory(item){
    var data = {
        source:item.source,
        category:item.category,
        mappingId:item.meta.category
    };
    if(_sxdebug)console.log("try to mapping stuff category.",data);
    $.ajax({
        url:"https://data.shouxinjk.net/_db/sea/my/stuff/mapping/category",
        type:"patch",
        data:JSON.stringify(data),//注意：不能使用JSON对象
        headers:{
            "Content-Type":"application/json",
            "Accept":"application/json"
        },
        success:function(result){
            console.log("stuff category mapping done.",result);
            goNextItem();
        }
    });
}

//批量修改my_stuff及platform_categories
//更新platform_categories中的设置条目：注意：由于my_stuff内无cid，不能采用insert方式，只用更新方式。另外，如果已经设置，则以此处更新优先
/**
function batchUpdatePlatformCategories(item){
    var data = {
        source:item.source,
        name:item.category,
        mappingId:item.meta.category,
        mappingName:item.meta.categoryName //采用meta.categoryName缓存标准类目名称
    };
    if(_sxdebug)console.log("try to mapping platform_categories.",data);
    $.ajax({
        url:"https://data.shouxinjk.net/_db/sea/category/platform_categories/mapping",
        type:"patch",
        data:JSON.stringify(data),//注意：不能使用JSON对象
        headers:{
            "Content-Type":"application/json",
            "Accept":"application/json"
        },
        success:function(result){
            if(_sxdebug)console.log("platform category mapping done.",result);
            goNextItem();
        }
    });
}
//**/
function batchUpdatePlatformCategories(item){
    var name = "";
    var names = [];
    if(Array.isArray(item.category)){
        name = item.category[item.category.length-1];
        names = item.category;
    }else if(item.category){
        var array = item.category.split(" ");
        name = array[array.length-1];
        names = array;
    }
    var platform_category = {
        _key:hex_md5(item.source+item.category),
        source:item.source,
        name:name,
        names:names,
        mappingId:item.meta.category,
        mappingName:item.meta.categoryName
    };
    console.log("try to commit platform category.",platform_category);
    $.ajax({
        url:"https://data.shouxinjk.net/_db/sea/category/platform_categories",
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

//点击跳转到原始链接
function jump(item){//支持点击事件
    //console.log(item.id,item.url);
    logstash(item,"buy",function(){
        var target = item.url;
        if(item.link.web2){
            target = item.link.web2;
            window.location.href = target;
        }else if(item.link.web){
            target = item.link.web;
            window.location.href = target;
        }else{
            //there is no url link to jump
            //it is a QRCODE
            $("#jumpbtn").text("扫码购买");
        }
    });
}

/*
<view class="person" data-url="{{_key}}" catchtap='jump'>
    <image class="person-img" mode="aspectFill" src="{{avatarUrl}}" data-url="{{_key}}" catchtap='jump'/>
    <view class="person-name">{{nickName}}</view>
    <!-- 关注按钮 -->
    <view class="connect-status{{connected?'':'-pending'}}">{{connected?'已关注':'+关注'}}</view> 
</view>  
*/
function showHosts(hosts){
    var template="<div class='person'>"+
    "<div class='logo'><img src='__imgSrc' alt='__name'/></div>"+//image
    "<div class='name'>__name</div>"+//name
    "<div class='connection'><button type='button' class='btn __status'>__text</button></div>"+//button
    "</div>";
    for(var i=0;i<hosts.length;i++){
        var h = hosts[i];
        var hostEl = template.replace(/__imgSrc/g,h.avatarUrl)
            .replace(/__name/g,h.nickName)
            .replace(/__status/g,"toconnect")
            .replace(/__text/g,"+关注");
        $("#author").append(hostEl);
    }
}

function loadItem(key){//获取内容列表
    $.ajax({
        url:"https://data.shouxinjk.net/_db/sea/my/stuff/"+key,
        type:"get",
        data:{},
        success:function(data){
            showContent(data);
            stuff = data;
            if(data.categoryId){//如果当前数据已经设置了ItemCategory
                //加载当前ItemCategory
                $("#category").val((data.category?data.category:"-")+":"+(data.categoryId?data.categoryId:"-"));//更改显示内容；
                //加载当前Property列表
                loadProps(data.categoryId);
            }
            if(data.address && data.address.trim().length>0){
                $("#address").val(data.address);
                getLocationByAddress(data.address);
            }
        }
    })            
}

function loadHosts(itemId){//获取推荐者列表，可能有多个
    $.ajax({
        url:"https://data.shouxinjk.net/_db/sea/user/users/",
        type:"get",
        data:{itemId:itemId},
        success:function(data){
            showHosts(data);
        }
    })
}

//加载顶部导航栏
function loadNavigationCategories(currentCategory){
    $.ajax({
        url:"https://data.shouxinjk.net/_db/sea/category/categories",
        type:"get",
        success:function(msg){
            var navObj = $(".navUl");
            for(var i = 0 ; i < msg.length ; i++){
                navObj.append("<li data='"+msg[i]._key+"'>"+msg[i].name+"</li>");
                if(currentCategory == msg[i]._key)//高亮显示当前选中的category
                    $(navObj.find("li")[i]).addClass("showNav");
            }
            //注册点击事件
            navObj.find("li").click(function(){
                var key = $(this).attr("data");
                //跳转到首页
                window.location.href = "index.html?category="+key;
            })
        }
    })    
}

//加载类目数据，加载完成后显示级联选择器
function loadCategories(){
    $.ajax({
        url:"https://data.shouxinjk.net/ilife/a/mod/itemCategory/all-categories?parentId=1",
        type:"get",
        success:function(res){
            //装载categories
            if(_sxdebug)console.log("got all categories",res);
            categories = res;  
            //显示级联选择
            showCascader(stuff.meta?stuff.meta.category:null);
        }
    })    
}

//显示级联选择器
function showCascader(categoryId){
    cascader = new eo_cascader(categories, {
        elementID: 'category-wrap',
        multiple: false, // 是否多选
        // 非编辑页，checkedValue 传入 null
        // 编辑时 checkedValue 传入最后一级的 ID 即可
        checkedValue: categoryId?[categoryId] : null,
        separator: '/', // 分割符 山西-太原-小店区 || 山西/太原/小店区
        clearable: false, // 是否可一键删除已选
        onSelect:function(selectedCategory){//回调函数，参数带有选中标签的ID和label。回传为：{id:[],label:[]}//其中id为最末级选中节点，label为所有层级标签
            if(_sxdebug)console.log("crawler::category item selected.",selectedCategory);
            //更新当前item的category。注意更新到meta.category下
            stuff.meta = {category:selectedCategory.id[0],categoryName:selectedCategory.label[0]};//仅保存叶子节点
            stuff.status.classify = "ready";//更新classify状态classify
            stuff.timestamp.classify = new Date();//更新classify时间戳
            //加载属性值列表
            loadProps(selectedCategory.id[0]);
        }
    });
    //对于已经设置的类目则直接显示属性列表
    if(stuff.meta && stuff.meta.category)
        loadProps(stuff.meta.category);
}


//根据ItemCategory类别，获取对应的属性配置，并与数据值融合显示
//1，根据key进行合并显示，以itemCategory下的属性为主，能够对应上的key显示绿色，否则显示红色
//2，数据显示，有对应于key的数值则直接显示，否则留空等待填写
function loadProps(categoryId){
    //根据categoryId获取所有measure清单，字段包括name、property
    $.ajax({
        url:"https://data.shouxinjk.net/ilife/a/mod/measure/measures?category="+categoryId,
        type:"get",
        data:{},
        success:function(items){
            if(_sxdebug)console.log(items);
            //在回调内：1，根据返回结果组装待展示数据，字段包括：name、property、value、flag(如果在则为0，不在为1)
            //var props = stuff.props?stuff.props:[];//临时记录当前stuff的属性列表
            var props = [];
            console.log("props:"+JSON.stringify(stuff.props),stuff.props);
            if(Array.isArray(stuff.props)){//兼容以数组形式存储的props：来源于客户端爬虫
                props = stuff.props;//临时记录当前stuff的属性列表
            }else{//兼容{key:value,key:value}对象：来源于服务器端API采集数据
                for(var key in stuff.props){
                    console.log(key+":"+stuff.props[key]);//json对象中属性的名字：对象中属性的值
                    var prop = {};
                    prop[key]=stuff.props[key];
                    props.push(prop);
                }
            }

              nodes = [];
              for( k in items ){
                var item = items[k];
                if(_sxdebug)console.log("measure:"+JSON.stringify(item));
                var name=item.name;
                var property = item.property;
                var value = props[property]?props[property]:"";
                for(j in props){
                    var prop = props[j];
                    var _key = "";
                    for ( var key in prop){//从prop内获取key
                        _key = key;
                        break;
                    }  
                    if(_key===property){//如果存在对应property：这是理想情况，多数情况下都只能通过name匹配
                        value = prop[_key];
                        props.splice(j, 1);//删除该元素
                        break;
                    }else if(_key===name){//如果匹配上name 也进行同样的处理
                        value = prop[_key];
                        props.splice(j, 1);//删除该元素
                        break;
                    }
                }
                var node = {
                    "name" :  name,
                    "property":property,
                    "value":value,
                    //"flag":true
                }
                nodes.push( node );
              }
              //添加未出现的property
                for(j in props){
                    var prop = props[j];
                    if(_sxdebug)console.log("un matched prop:"+JSON.stringify(prop));
                    var property="";
                    var value = "";
                    for (var key in prop){
                        property = key;
                        value = prop[key];
                        break;
                    }                   
                    var node = {
                        "name" :  property,//属性名直接作为显示名称
                        "property":property,
                        "value":value,
                        //"flag":false
                    }
                    nodes.push( node );
                }
              if(_sxdebug)console.log("prop Nodes:"+JSON.stringify(nodes));
              //return data;            
            //在回调内：2，组装并显示数据表格
            $("#propsList").jsGrid({
                width: "100%",
                //height: "400px",
         
                inserting: false,
                editing: true,
                sorting: false,
                paging: false,
                onItemInserted:function(row){
                    if(_sxdebug)console.log("item inserted",row);
                    //更新到当前修改item属性列表内
                    if(!stuff.props)
                        stuff.props = [];
                    //由于采用的是键值对，需要进行遍历。考虑到浏览器影响，此处未采用ES6 Map对象
                    var props = [];//新建一个数组
                    var prop = {};
                    prop[row.item.name] = row.item.value;//直接更新对应属性数值：注意，此处采用name更新，与页面采集器保持一致  
                    props.push(prop);
                    if(Array.isArray(stuff.props)){//兼容以数组形式存储的props：来源于客户端爬虫
                        stuff.props.forEach((item, index) => {//将其他元素加入
                          if(_sxdebug)console.log("foreach props.[index]"+index,item);
                          if(!item[row.item.name])
                            props.push(item);
                        });
                    }else{
                        for(var key in stuff.props){
                            console.log(key+":"+stuff.props[key]);//json对象中属性的名字：对象中属性的值
                            if(key!=row.item.name){
                                var prop = {};
                                prop[key]=stuff.props[key];
                                props.push(prop);
                            }
                        }                        
                    }
                    stuff.props = props;
                    if(_sxdebug)console.log("item props updated",stuff);                 
                },
                onItemUpdated:function(row){
                    if(_sxdebug)console.log("item updated",row);
                    if(!stuff.props)
                        stuff.props = [];                    
                    //由于采用的是键值对，需要进行遍历。考虑到浏览器影响，此处未采用ES6 Map对象
                    var props = [];//新建一个数组
                    var prop = {};
                    prop[row.item.name] = row.item.value;//直接更新对应属性数值：注意，此处采用name更新，与页面采集器保持一致  
                    props.push(prop);
                    console.log("stuff props.[json]"+JSON.stringify(stuff.props),stuff.props);
                    if(Array.isArray(stuff.props)){//兼容以数组形式存储的props：来源于客户端爬虫
                        stuff.props.forEach((item, index) => {//将其他元素加入
                          if(_sxdebug)console.log("foreach props.[index]"+index,item);
                          if(!item[row.item.name])
                            props.push(item);
                        });
                    }else{
                        for(var key in stuff.props){
                            console.log(key+":"+stuff.props[key]);//json对象中属性的名字：对象中属性的值
                            if(key!=row.item.name){
                                var prop = {};
                                prop[key]=stuff.props[key];
                                props.push(prop);
                            }
                        }                        
                    }
                    stuff.props = props; 
                    if(_sxdebug)console.log("item props updated",stuff);   
                },

                data: nodes,
         
                fields: [
                    {title:"名称", name: "name", type: "text", width: 100 },
                    //{title:"属性", name: "property", type: "text", width: 50 },
                    {title:"数值", name: "value", type: "text",width:200},
                    //{ name: "Matched", type: "checkbox", title: "Is Matched", sorting: false },
                    { type: "control" ,editButton: true,deleteButton: false,   width: 50}
                ]
            });   
            //显示属性列表
            $("#propsDiv").css("display","block");         
        }
    })     
}


//显示tag编辑框
function showTagging(tags){
    var moreTags = tags;
    //**
    for(var i=0;i<moreTags.length;i++){
        if(moreTags[i].trim().length>0)
            $('#tagging').append("<li>"+moreTags[i]+"</li>");
    }

    var eventTags = $('#tagging');

    var addEvent = function(text) {
        if(_sxdebug)console.log(text);
        //$('#events_container').append(text + '<br>');
    };

    eventTags.tagit({
        availableTags: moreTags,//TODO: 可以获取所有标签用于自动补全
        //**
        beforeTagAdded: function(evt, ui) {
            if (!ui.duringInitialization) {
                addEvent('beforeTagAdded: ' + eventTags.tagit('tagLabel', ui.tag));
            }
        },//**/
        afterTagAdded: function(evt, ui) {
            if (!ui.duringInitialization) {
                if(!stuff.tagging)
                    stuff.tagging = "";
                stuff.tagging += " "+eventTags.tagit('tagLabel', ui.tag);
                //stuff.tagging.push(eventTags.tagit('tagLabel', ui.tag));
                addEvent('afterTagAdded: ' + eventTags.tagit('tagLabel', ui.tag));
            }
        },
        //**
        beforeTagRemoved: function(evt, ui) {
            addEvent('beforeTagRemoved: ' + eventTags.tagit('tagLabel', ui.tag));
        },//**/
        afterTagRemoved: function(evt, ui) {
            if(!stuff.tagging)
                stuff.tagging = "";
            stuff.tagging = stuff.tagging.replace(eventTags.tagit('tagLabel', ui.tag),"").trim();
            addEvent('afterTagRemoved: ' + eventTags.tagit('tagLabel', ui.tag));
        },
        /**
        onTagClicked: function(evt, ui) {
            addEvent('onTagClicked: ' + eventTags.tagit('tagLabel', ui.tag));
        },//**/
        onTagExists: function(evt, ui) {
            addEvent('onTagExists: ' + eventTags.tagit('tagLabel', ui.existingTag));
        }
    });   

}

