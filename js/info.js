// 文档加载完毕后执行
$(document).ready(function ()
{
    //根据屏幕大小计算字体大小
    const oHtml = document.getElementsByTagName('html')[0]
    const width = oHtml.clientWidth;
    var rootFontSize = 12 * (width / 1440);// 在1440px的屏幕基准像素为12px
    rootFontSize = rootFontSize <8 ? 8:rootFontSize;//最小为8px
    oHtml.style.fontSize = rootFontSize+ "px";
    //设置正文部分宽度
    var bodyWidth = 960*width/1440; //1440分辨率下显示960宽度
    $("#body").width(bodyWidth);
    galleryWidth = bodyWidth*0.7;//占比70%，960下宽度为672
    galleryHeight = 9*galleryWidth/16;//宽高比为16:9
    $("#main").width(galleryWidth);
    //处理参数
    var args = getQuery();
    var category = args["category"]; //当前目录
    var id = args["id"];//当前内容
    //判断屏幕大小，如果是小屏则跳转
    if(width<800){
        window.location.href=window.location.href.replace(/info.html/g,"info2.html");
    }
    //加载导航和内容
    loadCategories(category);
    loadItem(id);   
    //loadHosts(id);//管理页面不需要加载关注列表

});

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
        //标签和链接
        var tagging = $("#tagging").val()?$("#tagging").val():"";
        var web2link = $("#web2link").val()?$("#web2link").val():"";
        var wap2link = $("#wap2link").val()?$("#wap2link").val():"";
        if(tagging.trim().length>0 && ((web2link.trim().length>0 && wap2link.trim().length>0) || item.link.qrcode)) {
            item.tagging = tagging;
            item.link.web2 = web2link;
            item.link.wap2 = wap2link;
            item.task.status = "indexed";
            item.status = "pending";//提交后需要重新分析
            console.log("now start commit index.",item);
            index(item);
        }else{
            $.toast({
                heading: 'Error',
                text: '标注和推广链接不能为空',
                showHideTransition: 'fade',
                icon: 'error'
            })
        }
    }); 
    //删除按钮：点击后更改状态：inactive
    $("#cancelbtn").click(function(){
        item.status = "inactive";
        index(item);
    });     
    //手工标注
    $("#tagging").val(item.tagging?item.tagging:"");  
    //pc推广链接
    $("#web2link").val(item.link.web2?item.link.web2:item.link.web);  
    //移动端推广链接 
    //标题
    $("#title").html(item.title);
    $("#wap2link").val(item.link.wap2?item.link.wap2:item.link.wap);  
    //分类
    $("#category").val((item.category?item.category:"-")+":"+(item.categoryId?item.categoryId:"-"));
    $("#changeCategoryBtn").click(//更改所属分类
        function(){
            $("#category").val((itemCategoryNew.category?itemCategoryNew.category:"-")+":"+(itemCategoryNew.categoryId?itemCategoryNew.categoryId:"-"));//更改显示内容；
            //获取属性列表并更新
            loadProps(itemCategoryNew.categoryId);
        }
    ); 
    //属性标注
    $("#changePropertyBtn").click(//提交属性值
        function(){
            console.log("待提交属性值：",nodes);
        }
    );     
    //评分
    if(item.rank.score){
        $("#score .comment").append("<div class='label'>评价</div><div class='rank'>"+item.rank.score+"/<span class='base'>"+item.rank.base+"</span></div>");
    }else{
        $("#score .comment").append("<div class='label'>评价</div><div class='rank'><span class='empty'>暂无评分</span></div>");
    }
    $("#score .price").append("<div class='label'>"+(item.price.currency?item.price.currency:"价格")+"</div><div class='price-sale'><span class='price-bid'>"+(item.price.bid?item.price.bid:"")+"</span>"+item.price.sale+"</div>");
    //$("#score .price").append("<div class='label'>价格</div><div class='price-sale'>"+item.price.sale+"</div>");
    $("#score .score").append("<div class='label'>推荐度</div><div class='match'>"+(item.rank.match*100)+"%</div>");
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
    for(var i=0;i<item.tags.length;i++){
        $("#tags").append("<div class='tag'>" + item.tags[i] + "</div>");
    }
    //获取分类树
    $("#categoryTree").jstree({
          "core" : {
            "data" : {
                "url":"http://www.shouxinjk.net/ilife/a/mod/itemCategory/categoriesAndMeasures",
                "data":function(node){
                  return { parentId : node.id==='#'?'1':node.id};
                },

                /**
                //该版本jsTree不支持在回调中修改数据，直接通过原始返回数据支持
                //另一种方法：通过jquery converters对数据进行修改，尚未尝试
                "success" : function(items) {
                      data = [];
                      for( k in items ){
                        var item = items[k];
                        console.log("node:"+JSON.stringify(item));
                        node = {
                            "id" :  item.id,
                            "parent":item.pId=="1"?"#":item.pId,
                            "text":item.name,
                            "children":true,
                            "state" : {"closed":true}//important: to show collapsed button always
                        }
                        data.push( node );
                      }
                      console.log("nodes"+JSON.stringify(data));
                      return data; 
                }
                //**/
             },
          },
      }); 
      //分类树变化事件：
    $('#categoryTree').on("changed.jstree", function (e, data) {
        //TODO：更新当前选中的字段
        if(data.node.original.type==="category"){//仅在节点为Category时才切换
            console.log("Category:"+JSON.stringify(data.node.original));
            itemCategoryNew.category = data.node.text;
            itemCategoryNew.categoryId = data.node.id;
        }else{
            console.log("Measure:"+JSON.stringify(data.node.original));
        }
    });        
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

//根据ItemCategory类别，获取对应的属性配置，并与数据值融合显示
//1，根据key进行合并显示，以itemCategory下的属性为主，能够对应上的key显示绿色，否则显示红色
//2，数据显示，有对应于key的数值则直接显示，否则留空等待填写
function loadProps(categoryId){
    //根据categoryId获取所有measure清单，字段包括name、property
    $.ajax({
        url:"http://www.shouxinjk.net/ilife/a/mod/measure/measures?category="+categoryId,
        type:"get",
        data:{},
        success:function(items){
            console.log(items);
            //在回调内：1，根据返回结果组装待展示数据，字段包括：name、property、value、flag(如果在则为0，不在为1)
            var props = stuff.props;//临时记录当前stuff的属性列表
              nodes = [];
              for( k in items ){
                var item = items[k];
                console.log("measure:"+JSON.stringify(item));
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
                    console.log("un matched prop:"+JSON.stringify(prop));
                    var property="";
                    var value = "";
                    for (var key in prop){
                        property = key;
                        value = prop[key];
                        break;
                    }                   
                    var node = {
                        "name" :  "",
                        "property":property,
                        "value":value,
                        //"flag":false
                    }
                    nodes.push( node );
                }
              console.log("prop Nodes:"+JSON.stringify(nodes));
              //return data;            
            //在回调内：2，组装并显示数据表格
            $("#propsList").jsGrid({
                width: "100%",
                //height: "400px",
         
                inserting: true,
                editing: true,
                sorting: false,
                paging: false,
         
                data: nodes,
         
                fields: [
                    {title:"名称", name: "name", type: "text", width: 50 },
                    {title:"属性", name: "property", type: "text", width: 50 },
                    {title:"数值", name: "value", type: "text",width:50},
                    //{ name: "Matched", type: "checkbox", title: "Is Matched", sorting: false },
                    { type: "control" }
                ]
            });            
        }
    })     

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
            window.location.href="index.html";
        }
    })            
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

function loadCategories(currentCategory){
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

