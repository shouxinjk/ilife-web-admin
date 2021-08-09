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

    //设置提示信息
    hideHeaderBar = args["hideHeaderBar"]?true:false;//控制是否显示顶部提示条
    if(hideHeaderBar){//如果为false则隐藏
        $("#headerDiv").css('display','none'); 
    }

    //初始化两颗目录树
    treeSource = new dhx.Tree("tree-source", {
        dragMode: "both",//支持反向从第三方平台建立标准属性
        autoload: sourceTreeDataUrl
    });

    //loadPlatforms(source);//加载顶部导航栏

    loadSourceTree();//加载标准目录树
    loadProperties();//加载属性值列表
});

var columnWidth = 300;//默认宽度300px
var columnMargin = 5;//默认留白5px

var source = "pdd";//电商平台：默认为拼多多，其他通过参数传递
var sourceRoot = "0";//默认为拼多多

var hideHeaderBar = false;//是否显示顶部header，默认为false。通过参数 hideHeaderBar 控制隐藏

var treeSource = null;
var treeTarget = null;

var sourceArray = ["pdd","jd","tmall","taobao","kaola","fliggy","ctrip","gome","suning","dangdang","dhc","amazon"];//source list

//**
var sourceTreeDataUrl = "http://www.shouxinjk.net/ilife/a/mod/itemCategory/standard-properties";
var targetTreeDataUrl = "http://www.shouxinjk.net/ilife/a/mod/itemCategory/third-party-properties";
var thirdpartyPlatforms = "http://www.shouxinjk.net/ilife/a/mod/itemCategory/third-party-platforms";
//**/
/**
var sourceTreeDataUrl = "http://localhost:8080/iLife/a/mod/itemCategory/standard-properties";
var targetTreeDataUrl = "http://localhost:8080/iLife/a/mod/itemCategory/third-party-properties";
var thirdpartyPlatforms = "http://localhost:8080/iLife/a/mod/itemCategory/third-party-platforms";
//**/
//加载标注分类树：标准分类树的叶子节点作为draggable节点
function loadSourceTree(){
    //获取标准分类树，默认获取第一级分类
    console.log("\n\nstart query standard categories ...");
    treeSource.data.load(sourceTreeDataUrl+"?id=tree-source");//默认情况下，直接挂到div节点，id与div-id一致。后端API接口需要进行处理：映射到根节点的ID
    treeSource.events.on("ItemClick", function(id, e){
        console.log("The item with the id "+ id +" was clicked.");
        if(id.startsWith("prop-")){//如果是属性则加载属性值
            //先清空属性值显示区域
            $("#property-values").empty();
            //获取属性值列表并显示 
            loadProperties(id.replace("prop-",""));
        }
    });    

    //注册事件：点击展开整棵树
    $("#expandSourceTree").click(function(){
        treeSource.expandAll();
    });    
}

//加载属性列表
function loadProperties(propertyId){
    $.ajax({
        url:"http://www.shouxinjk.net/ilife/a/ope/performance/rest/byMeasureId?measureId="+propertyId,
        type:"get",
        success:function(msg){
            var divObj = $("#property-values");
            for(var i = 0 ; i < msg.length ; i++){
                divObj.append("<div class='list-group-item nested-1' draggable='false' data-id='"+msg[i].id+"' data-level='"+(msg[i].level?msg[i].level:'')+"' data-score='"+(msg[i].markedValue?msg[i].markedValue:'')+"' style>"+msg[i].originalValue+"</div>");
            }
            //加载完成后显示到界面
            showProperties();
        }
    })    
}

//显示属性列表
function showProperties(){
    // Nested demo
    var nestedSortables = [].slice.call(document.querySelectorAll('.nested-sortable'));

    // Loop through each nested sortable element
    for (var i = 0; i < nestedSortables.length; i++) {
        new Sortable(nestedSortables[i], {
            group: 'nested',
            animation: 150,
            fallbackOnBody: true,
            swapThreshold: 0.65,
            ghostClass: 'blue-background-class',
            // 元素从一个列表拖拽到另一个列表
            /*
            onAdd: function (evt) {
                // same properties as onEnd
                console.log("onAdd",evt);
            },
        
            // 列表内元素顺序更新的时候触发
            onUpdate: function (evt) {
                // same properties as onEnd
                console.log("onUpdate",evt);
            },
            //**/
            // 列表的任何更改都会触发
            //**
            onSort: function (evt) {
                // same properties as onEnd
                console.log("onSort",evt);
            },
            //**/
            // 元素从列表中移除进入另一个列表
            /**
            onRemove: function (evt) {
                // same properties as onEnd
                console.log("onRemove",evt);
            },
            //**/
        });
    }    
}


