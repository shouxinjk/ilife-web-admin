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
    console.log(args);
    source = args["source"]?args["source"]:source; //支持根据电商平台切换，默认为pdd
    sourceRoot = args["sourceRoot"]?args["sourceRoot"]:sourceRoot; //支持根据电商平台切换，默认为pdd

    //初始化两颗目录树
    treeSource = new dhx.Tree("tree-source", {
        dragMode: "source",//仅支持拖出
        autoload: sourceTreeDataUrl
    });

    treeTarget = new dhx.Tree("tree-target", {
        dragMode: "both",//可能会放置错误，允许调整
        dropBehaviour: "child",
        autoload: targetTreeDataUrl+"/"+source //通过pathvariable传递source参数
    });

    loadPlatforms(source);//加载顶部导航栏

    loadSourceTree();//加载标准目录树
    loadTargetTree(source);//默认加载拼多多目录树
});

var columnWidth = 300;//默认宽度300px
var columnMargin = 5;//默认留白5px

var source = "pdd";//电商平台：默认为拼多多，其他通过参数传递
var sourceRoot = "0";//默认为拼多多

var treeSource = null;
var treeTarget = null;

var sourceArray = ["pdd","jd","tmall","taobao","kaola","fliggy","ctrip","gome","suning","dangdang","dhc","amazon"];//source list

//**
var sourceTreeDataUrl = "http://www.shouxinjk.net/ilife/a/mod/itemCategory/standard-categories";
var targetTreeDataUrl = "http://www.shouxinjk.net/ilife/a/mod/itemCategory/third-party-categories";
var thirdpartyPlatforms = "http://www.shouxinjk.net/ilife/a/mod/itemCategory/third-party-platforms";
//**/
/**
var sourceTreeDataUrl = "http://localhost:8080/iLife/a/mod/itemCategory/standard-categories";
var targetTreeDataUrl = "http://localhost:8080/iLife/a/mod/itemCategory/third-party-categories";
var thirdpartyPlatforms = "http://localhost:8080/iLife/a/mod/itemCategory/third-party-platforms";
//**/
//加载标注分类树：标准分类树的叶子节点作为draggable节点
function loadSourceTree(){
    //获取标准分类树，默认获取第一级分类
    console.log("\n\nstart query standard categories ...");
    treeSource.data.load(sourceTreeDataUrl+"?id=tree-source");//默认情况下，直接挂到div节点，id与div-id一致。后端API接口需要进行处理：映射到根节点的ID
    treeSource.events.on("ItemClick", function(id, e){
        console.log("The item with the id "+ id +" was clicked.");
        //treeSource.data.load(sourceTreeDataUrl+"?id="+id); 
        treeSource.toggle(id);
    });    

    //注册事件：点击展开整棵树
    $("#expandSourceTree").click(function(){
        treeSource.expandAll();
    });    
}

//加载平台分类树：各平台分类的叶子节点作为dropable节点
function loadTargetTree(source){
    //获取电商分类树，默认获取第一级分类
    console.log("\n\nstart query "+source+" categories ...");
    treeTarget.data.load(targetTreeDataUrl+"/"+source+"?id=tree-target");  //默认情况下，直接挂到div节点，id与div-id一致。后端API接口需要进行处理：映射到根节点的ID
    treeTarget.events.on("ItemClick", function(id, e){
        console.log("The item with the id "+ id +" was clicked.");
        treeTarget.toggle(id);
    });    
    treeTarget.events.on("AfterDrop", function(id, e){
        console.log("item dropped.",id);
        //TODO: connect standard category to 3party category here.
        //$("li[dhx_id='"+id.start+"'] .dhx_tree-list-item__text").css("color", "#ff0000");
        //$("li[dhx_id='"+id.target+"'] .dhx_tree-list-item__text:first").css("color", "#00ff00");
    });      

    //注册事件：点击展开整棵树
    $("#expandTargetTree").click(function(){
        treeSource.expandAll();
    });      
}

//加载顶部导航栏，用于切换不同的电商平台
function loadPlatforms(currentPlatform){
    $.ajax({
        url:thirdpartyPlatforms,
        type:"get",
        success:function(msg){
            var navObj = $(".navUl");
            for(var i = 0 ; i < msg.length ; i++){
                navObj.append("<li data='"+msg[i].id+"' rootNode='"+msg[i].root+"'>"+msg[i].name+"</li>");
                if(currentPlatform == msg[i].id)//高亮显示当前选中的platform
                    $(navObj.find("li")[i]).addClass("showNav");
            }
            //注册点击事件
            navObj.find("li").click(function(){
                var key = $(this).attr("data");
                var rootNode = $(this).attr("rootNode");
                //跳转到首页
                window.location.href = "labeling-category.html?source="+key+"&sourceRoot="+rootNode;
            })
        }
    })    
}



