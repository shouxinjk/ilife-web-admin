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
    loadCategories(category);

    //设置提示信息
    showAllItems = args["showAllItems"]?true:false;//传入该参数则显示全部内容
    if(showAllItems){
        $("#tipText").text("当前显示全部商品，请关闭自动入库功能");
        $('#tipText').css('color', 'red');
    }
});

var columnWidth = 300;//默认宽度300px
var columnMargin = 5;//默认留白5px

var loading = false;
var dist = 500;
var num = 1;//需要加载的内容下标

var items = [];//所有内容列表
var category  = 0; //当前目录

var hasMore = false;
var cursorId = null;

var showAllItems = false;

setInterval(function ()
{
    if ($(window).scrollTop() >= $(document).height() - $(window).height() - dist && !loading)
    {
        // 表示开始加载
        loading = true;

        // 加载内容
        if(items.length < num){//如果内容未获取到本地则继续获取
            if(hasMore && cursorId!=null){//有游标则直接从游标中获取
                loadMore();
            }else{//否则发起新查询
                loadItems();
            }
        }else{//否则使用本地内容填充
            insertItem();
        }
    }
}, 60);

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
//*/

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
    var title = "<div class='title'>"+item.distributor.name+" "+item.title+"</div>"
    $("#waterfall").append("<li><div data='"+item._key+"'>" + image +title+ "</div></li>");
    num++;

    //注册事件
    $("div[data='"+item._key+"']").click(function(){
        //跳转到详情页
        window.location.href = "info.html?category="+category+"&id="+item._key+(showAllItems?"&showAllItems=true":"");
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
                changeCategory(key);//更换后更新内容
                $(navObj.find("li")).removeClass("showNav");
                $(this).addClass("showNav");
            })
        }
    })    
}

function changeCategory(key){
    category = key;//更改当前category
    items = [];//清空列表
    $("#waterfall").empty();//清除页面元素
    num=1;//设置加载内容从第一条开始
    loadItems();//重新加载数据
}