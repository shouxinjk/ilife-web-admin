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

    loadSourceTree();//加载标准目录树
});

var columnWidth = 300;//默认宽度300px
var columnMargin = 5;//默认留白5px

var source = "pdd";//电商平台：默认为拼多多，其他通过参数传递
var sourceRoot = "0";//默认为拼多多

var hideHeaderBar = false;//是否显示顶部header，默认为false。通过参数 hideHeaderBar 控制隐藏

var treeSource = null;

var persona = {};//存储属性值列表
var formScheme ={};//json form 定义
var formSubmit = function (errors, values) {//jsonform 提交函数
          if (errors) {
            console.log("got erros.",errors);
            $.toast({
                heading: 'Error',
                text: ''+errors,
                showHideTransition: 'fade',
                icon: 'error'
            })  
          }else {
            console.log("try to submit data.",values);
            commitPersona(values);
          }
        };

var sourceTreeDataUrl = "http://www.shouxinjk.net/ilife/a/mod/persona/rest/tree";
//var sourceTreeDataUrl = "http://localhost:8080/iLife/a/mod/persona/rest/tree";

//加载标注分类树，包括phase及persona
function loadSourceTree(){
    //获取分类树，默认获取第一级阶段列表
    console.log("\n\nstart query phases and personas ...");
    treeSource.data.load(sourceTreeDataUrl+"?id=tree-source");//默认情况下，直接挂到div节点，id与div-id一致。后端API接口需要进行处理：映射到根节点的ID
    treeSource.events.on("ItemClick", function(id, e){
        console.log("The item with the id "+ id +" was clicked.");
        treeSource.toggle(id);
        loadForm(id);//点击后尝试显示画像列表，仅对persona节点有效
    });      
}

//构建persona表单
function loadForm(personaId){   
    if(personaId.indexOf("persona-")>=0){
        $("form").empty();   //清空原有标注表单
        initializeForm(personaId.replace(/persona\-/g,""));  //加载表单时需要去掉 persona- 前缀
    }else{
        console.log("请选择一个画像啊，笨蛋蛋蛋蛋~~~");
    }
}

//初始化JsonForm。分为两步：1 获取persona schema；2 获取已有标注values；完成后显示表单
function initializeForm(personaId){
    $.ajax({//查询得到schema定义
        type: "GET",
        url: "http://www.shouxinjk.net/ilife/a/mod/viewTemplate/rest/type/persona",
        data: {},
        success:function(result){
            console.log("got persona form scheme.",result);
            if(result.data){//已经得到scheme，接下来获取具体数值
                formScheme = result.data;
                loadPersona(personaId);
            }else{
                console.log("failed retrieve json scheme.");
            }
        }
    });    
}

//查询persona数据，并装载scheme
function loadPersona(personaId){
    $.ajax({//查询得到schema定义
        type: "GET",
        url: "https://data.shouxinjk.net/_db/sea/persona/personas/"+personaId,
        data: {},
        success:function(result){
            console.log("got persona.",result);
            if(!result._key){
                persona = { //设置一个空白persona，并且_key与personaId保持一致
                    _key:personaId
                }  
                createPersona(persona);              
            }else{
                persona = result;               
            }
            //将值设置进入form scheme
            formScheme.value = persona;             
            //设置提交事件
            formScheme.onSubmit = formSubmit;
            console.log("scheme with value.",formScheme);
            //可以显示表单了，并且是带着persona数值的
            $('form').jsonForm(formScheme);
        }
    });      
}

//并且提交属性明细到数据库
function commitPersona(values){
    $.ajax({//提交Persona定义
        type: "PATCH",
        url: "https://data.shouxinjk.net/_db/sea/persona/personas/"+persona._key,
        data: JSON.stringify(values),
        success:function(result){
            console.log("persona data committed.",result);
            $.toast({
                heading: 'Success',
                text: '数据已提交',
                showHideTransition: 'fade',
                icon: 'success'
            }) 
        }
    });  
}

//查询失败则直接创建一个Persona
function createPersona(persona){
    $.ajax({//提交Persona定义
        type: "POST",
        url: "https://data.shouxinjk.net/_db/sea/persona/personas",
        data: JSON.stringify(persona),
        success:function(result){
            console.log("persona created.",result);
            createNewPersona = false;//恢复设置
            $.toast({
                heading: 'Info',
                text: 'Persona已创建',
                showHideTransition: 'fade',
                icon: 'info'
            }) 
        }
    }); 
}



