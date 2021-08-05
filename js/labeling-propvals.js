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

var  changeGridHeightTimer = setInterval(changeGridHeight,500);//设置个定时器改JsGrid高度，抱歉没找到更好的方法

var columnWidth = 300;//默认宽度300px
var columnMargin = 5;//默认留白5px

var source = "pdd";//电商平台：默认为拼多多，其他通过参数传递
var sourceRoot = "0";//默认为拼多多

var hideHeaderBar = true;//是否显示顶部header，默认为false。通过参数 hideHeaderBar 控制隐藏

var treeSource = null;
var treeTarget = null;
var propValues = null;//存储属性值列表

var valsChart = null;//vals图表
var costChart = null;//成本图表

var sourceArray = ["pdd","jd","tmall","taobao","kaola","fliggy","ctrip","gome","suning","dangdang","dhc","amazon"];//source list

//**
var sourceTreeDataUrl = "http://www.shouxinjk.net/ilife/a/mod/itemCategory/standard-categories";
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
        loadProperties(id);
    });    

    //注册事件：点击展开整棵树
    $("#expandSourceTree").click(function(){
        treeSource.expandAll();
    });    
}

//加载属性列表
function loadProperties(categoryId){
    if(categoryId){
        propValues = null;
        $("#property-values").empty();    
        initializeGrid(categoryId);  
        showProperties();
    }else{
        //showSumAndCharts(false);//隐藏汇总数据及图表
        console.log("请选择一个属性啊，笨蛋");
    }
}

//显示属性列表
function showProperties(){
    $("#property-values").jsGrid({
        height: "90%",
        width: "100%",

        filtering: false,
        editing: true,
        sorting: true,
        paging: true,
        autoload: true,

        pageSize: 30,
        pageButtonCount: 5,

        deleteConfirm: "Do you really want to delete the item?",

        controller: propValues,

        fields: [
            { name: "name", type: "text",align: "center", readOnly: true,title: "名称" },
            { name: "percentage", type: "text", align: "center", title: "比重" },
            { name: "alpha", type: "text", align: "center", title: "alpha" },
            { name: "beta", type: "text", align: "center", title: "beta" },
            { name: "gamma", type: "text", align: "center", title: "gamma" },
            { name: "delte", type: "text", align: "center", title: "delte" },
            { name: "epsilon", type: "text", align: "center", title: "epsilon" },
            { name: "zeta", type: "text", align: "center", title: "zeta" },
            { name: "eta", type: "text", align: "center", title: "eta" },
            { name: "theta", type: "text", align: "center", title: "theta" },
            {//动态汇总当前vals值是否合计为1
                align:'center',
                headerTemplate: function() {
                    return "<th class='jsgrid-header-cell jsgrid-align-center jsgrid-header-sortable' style='width: 100px;'>vals小计</th>";
                },
                itemTemplate: function(value, item) {
                    var subTotal= item.alpha+item.beta+item.gamma+item.delte+item.epsilon;
                    updateCharts(); //刷新图表：只能在更新数据时执行
                    return "<span style='width: 100px;color:"+(subTotal.toFixed(2)==1?"green":"red")+";font-weight:bold;'>"+subTotal.toFixed(2)+"</span>";
                }
            },
            {//动态汇总当前cost值是否合计为1
                align:'center',
                headerTemplate: function() {
                    return "<th class='jsgrid-header-cell jsgrid-align-center jsgrid-header-sortable' style='width: 100px;'>cost小计</th>";
                },
                itemTemplate: function(value, item) {
                    var subTotal= item.zeta+item.eta+item.theta;
                    return "<span style='width: 100px;color:"+(subTotal.toFixed(2)==1?"green":"red")+";font-weight:bold;'>"+subTotal.toFixed(2)+"</span>";
                }
            },            
            { type: "control" }
        ]
    });
 
}

function initializeGrid(categoryId){
    propValues = {
        loadData: function(filter) {
           return $.ajax({
                type: "GET",
                url: "http://www.shouxinjk.net/ilife/a/mod/measure/rest/category/"+categoryId,
                data: filter,
                success:function(result){
                    //更新界面显示
                    //updateCharts();        
                } 
            });
        },
        /**
        insertItem: function(item) {
            console.log("does not support. cannot add value now.");
        },
        //**/
        updateItem: function(item) { 
           return $.ajax({
                type: "POST",
                url: "http://www.shouxinjk.net/ilife/a/mod/measure/rest/propvals",
                data: item,
                success:function(result){
                    //更新界面显示
                    updateCharts();       
                }                
            });
        },
        /**
        deleteItem: function(item) {
            console.log("does not support. cannot delete value now.");
        }
        //**/

    };
}

function updateCharts(){
    var items = $("#property-values").jsGrid("option", "data" );
    console.log("update charts using  data.",items); 
    if(items.length==0){
        return;
    }
    var w=0,a=0,b=0,c=0,d=0,e=0,x=0,y=0,z=0;
    //循环计算
    for(var i=0;i<items.length;i++){
        var item = items[i];
        w = w+item.percentage;
        a = a+item.alpha;
        b = b+item.beta;
        c = c+item.gamma;
        d = d+item.delte;
        e = e+item.epsilon;
        x = x+item.zeta;
        y = y+item.eta;
        z = z+item.theta
    }
    //设置汇总显示
    $("#total-w").html("<span style='color:"+(w.toFixed(2)==1?"green":"red")+";font-weight:bold;'>"+w.toFixed(2)+"</span>");//html
    $("#total-a").text(a.toFixed(2));
    $("#total-b").text(b.toFixed(2));
    $("#total-c").text(c.toFixed(2));
    $("#total-d").text(d.toFixed(2));
    $("#total-e").text(e.toFixed(2));
    $("#total-x").text(x.toFixed(2));
    $("#total-y").text(y.toFixed(2));
    $("#total-z").text(z.toFixed(2));
    $("#sum-div").css("display","block");

    //分别更新两个图表
    updateValsChart(a,b,c,d,e);
    updateCostChart(x,y,z);

    //修改JsGrid实际高度：采用暴力办法，每行高度26，总高度 = (行数+1)*26
    $("#property-values").css("height",($("#property-values").jsGrid("option", "data" ).length+1)*26+"px");

    showSumAndCharts(true);//显示汇总及图表
}

function updateValsChart(a,b,c,d,e){
    if(!valsChart){
        valsChart = echarts.init(document.getElementById('vals-chart'));
    }
    option = {
        title: {
            text: 'VALS分布'
        },        
        xAxis: {
            type: 'category',
            data: ['alpha', 'beta', 'gamma', 'delte', 'epsilon']
        },
        yAxis: {
            type: 'value',
            label : {show: true},   //顶部显示数值
        },
        series: [{
            data: [a,b,c,d,e],
            type: 'line',
            smooth: true
        }]
    };
    valsChart.setOption(option);
}

function updateCostChart(x,y,z){
    if(!costChart){
        costChart = echarts.init(document.getElementById('cost-chart'));
    }
    option = {
        title: {
            text: '成本分布'
        },        
        xAxis: {
            type: 'category',
            data: ['zeta', 'eta', 'theta']
        },
        yAxis: {
            type: 'value'
        },
        series: [{
            data: [x,y,z],
            type: 'line',
            smooth: true
        }]
    };
    costChart.setOption(option);
}

function showSumAndCharts(show){
    if(show){
        $("#sum-div").css("display","display");
        $("#sum-chart").css("display","display");
    }else{//echarts使用display:none会导致无法计算尺寸，未启用
        $("#sum-div").css("display","none");
        $("#sum-chart").css("display","none");
    }
}


function changeGridHeight(){ 
    //修改JsGrid实际高度：采用暴力办法，每行高度26，总高度 = (行数+1)*26
    var elmentHeight = $("#property-values").height();
    var expectHeight = ($("#property-values").jsGrid("option", "data" ).length+1)*26;
    if(elmentHeight==expectHeight){
        console.log("change jsgrid height end.",elmentHeight,expectHeight);
        //clearInterval(changeGridHeightTimer);
    }else{
        console.log("try to change jsgrid height.",elmentHeight,expectHeight);
        $("#property-values").css("height",expectHeight+"px");
    }
}