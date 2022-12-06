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
    chartWidth = bodyWidth*0.4;
    galleryWidth = bodyWidth*0.55;//占比70%，960下宽度为672
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

    loadWxGroups(args["brokerId"]);//加载可用微信群

    //判断是否是嵌入模式：hideHeaderBar
    hideHeaderBar = args["hideHeaderBar"]?true:false;
    if(hideHeaderBar){
        $(".header").css("display","none");
    }

    $("#findAll").click(function(){//注册搜索事件：点击搜索全部
        var tagging = $(".search input").val().trim();
        window.location.href=indexPage+"?tagging="+tagging+"&classify=all&categoryName=-&showAllItems=true";
    }); 
    //回车直接执行搜索
    $(document).keyup(function(event){                   
        if(event.keyCode ==13){                      
            var tagging = $(".search input").val().trim();
            window.location.href=indexPage+"?tagging="+tagging+"&classify=all&categoryName=-&showAllItems=true";                
        }                  
    });     
    $("#findByPrice").click(function(){//注册搜索事件：byPrice
        var tagging = $(".search input").val().trim();
        window.location.href=indexPage+"?tagging="+tagging+"&classify=all&categoryName=-&showAllItems=true&filter=byPrice";
    }); 
    $("#findByRank").click(function(){//注册搜索事件：byRank
        var tagging = $(".search input").val().trim();
        window.location.href=indexPage+"?tagging="+tagging+"&classify=all&categoryName=-&showAllItems=true&filter=byRank";
    });
    $("#findByProfit").click(function(){//注册搜索事件：byProfit
        var tagging = $(".search input").val().trim();
        window.location.href=indexPage+"?tagging="+tagging+"&classify=all&categoryName=-&showAllItems=true&filter=byProfit";
    });        

    //显示tabs
    $( "#tabs" ).tabs();

    //注册发送到运营群事件：发送商品URL链接，以图文形式发送
    $("#sendWebhookItem").click(function(e){
        sendItemMaterialToWebhook(" 商品推荐",
            "https://www.biglistoflittlethings.com/ilife-web-wx/info2.html?id="+stuff._key,
            stuff.logo?stuff.logo:stuff.images[0].replace(/\.avif/,'')
            );//发送到企业微信群
    });
    //注册发送微博事件：发送商品信息到微博，包含地址、推荐语、图片。其中图片优先选择评价图片
    $("#sendWeiboItem").click(function(e){
        sendItemMaterialToWeibo();//发送到微博
    });    
    //注册图片发送到运营群事件：蒙德里安图片
    $("#sendWebhookMondrian").click(function(e){
        var id = $(this).attr("id").replace(/sendWebhook/g,"").toLowerCase();
        var imgUrl = $("#"+id+"Img img").attr("src");
        if(imgUrl && imgUrl.length>0)
            sendItemMaterialToWebhook(" 蒙德里安照片",imgUrl,imgUrl);//发送到企业微信群
    });
    //注册图片发送到运营群事件：雷达图
    $("#sendWebhookRadar").click(function(e){
        var id = $(this).attr("id").replace(/sendWebhook/g,"").toLowerCase();
        var imgUrl = $("#"+id+"Img img").attr("src");
        if(imgUrl && imgUrl.length>0)
            sendItemMaterialToWebhook(" 评价结果",imgUrl,imgUrl);//发送到企业微信群
    });
    //注册图片发送到运营群事件：评价放射图
    $("#sendWebhookSunburst").click(function(e){
        var id = $(this).attr("id").replace(/sendWebhook/g,"").toLowerCase();
        var imgUrl = $("#"+id+"Img img").attr("src");
        if(imgUrl && imgUrl.length>0)
            sendItemMaterialToWebhook(" 评价指标",imgUrl,imgUrl);//发送到企业微信群
    });  
    //注册图片发送到运营群事件：海报
    $("#sendWebhookPoster").click(function(e){
        var imgUrl = $("#poster img").attr("src");
        if(imgUrl && imgUrl.length>0)
            sendItemMaterialToWebhook(" 海报",imgUrl,imgUrl);//发送到企业微信群
    });  
    //注册图片发送到运营群事件：图文内容
    $("#sendWebhookArticle").click(function(e){
        var articleId = $("#btnPreview").attr("data-resId");
        if(articleId && articleId.length>0)
            sendItemArticleToWebhook(articleId);//发送到企业微信群
    });  

    //判断是从index.html进入还是从index-metrics.html进入
    if (document.referrer && document.referrer.indexOf("index-metrics")>=0  ) {
        // 表示从index-metrics而来
        indexPage = "index-metrics.html";
    }     
        
});

var _sxdebug = true;
var imgPrefix = "https://www.biglistoflittlethings.com/3rdparty?url=";

var indexPage = "index.html";

var hideHeaderBar = true;
var showAllItems = false;
var map = null;

var chartWidth = 500;

var galleryWidth = 673;
var galleryHeight = 378;

//当前条目
var stuff = {};
var broker = {};//当前达人

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

var posterSchemes = {};//缓存posterScheme，存储posterId、options

//支持的类目
var categories = [];
var cascader = null;//级联选择器实例

//评价指标列表
var measureScheme = [];//每一项包含name weight children

//根据达人ID加载活跃微信群
function loadWxGroups(brokerId){
    console.log("try to load wx groups by brokerId.",brokerId);
    $.ajax({
        url:app.config.sx_api+"/wx/wxGroup/rest/listByBrokerId?brokerId="+brokerId,
        type:"get",        
        success:function(ret){
            console.log("===got wx groups===\n",ret);
            //加载到界面供选择
            ret.forEach(function(wxgroup){
                console.log("===got wx groups===\n",wxgroup);
                $("#wxGroup").append("<div style='line-height:20px;'><input id='wxg"+wxgroup.id+"' name='wxgroups' type='checkbox' data-name='"+wxgroup.name+"' value='"+wxgroup.id+"' style='vertical-align:middle;' checked/><label for='wxg"+wxgroup.id+"' style='margin-top:5px;margin-left:2px;'>"+wxgroup.name +" "+ wxgroup.type +" / "+wxgroup.members +"人 / "+wxgroup.broker.nickname+ "</label></div>");
            });
            //没有微信群则提示
            if(ret.length==0){
                $("#wxGroup").append("<div style='line-height:20px;font-size:12px;color:red;'>请先建立微信群，并设置手动推送任务</div>");
                $("#sendWxGroup").css("display","none");
            }else{
                $("#btnCheckAll").css("display","block");
                $("#btnUncheckAll").css("display","block");                
            }
        }
    }); 
    //注册点击事件
    $("#sendWxGroup").click(function(){
        var selectedWxGroups = [];
        $("input[name='wxgroups']:checked").each(function(){
            selectedWxGroups.push($(this).val());
            saveFeaturedItem(getUUID(), brokerId, "wechat", $(this).val(), $(this).attr("data-name"), "item", stuff._key, JSON.stringify(stuff), "pending");
        });   
        if(selectedWxGroups.length>0){
            console.log("selected wxgroups.",selectedWxGroups);
            siiimpleToast.message('哦耶，推送已安排',{
              position: 'bottom|center'
            });             
        }else{
            console.log("no group selected.");
            siiimpleToast.message('请选择微信群先~~',{
              position: 'bottom|center'
            });             
        }     
    });
    //选中全部
    $("#btnCheckAll").click(function(){
        $("input[name='wxgroups']").prop("checked","true"); 
    });
    //取消选中
    $("#btnUncheckAll").click(function(){
        $("input[name='wxgroups']").removeAttr("checked"); 
    });  

}
//存储featured item到ck
function saveFeaturedItem(eventId, brokerId, groupType, groupId, groupName,itemType, itemKey, jsonStr, status){
  var q = "insert into ilife.features values ('"+eventId+"','"+brokerId+"','"+groupType+"','"+groupId+"','"+groupName+"','"+itemType+"','"+itemKey+"','"+jsonStr.replace(/'/g, "’")+"','"+status+"',now())";
  console.log("try to save featured item.",q);
  jQuery.ajax({
    url:app.config.analyze_api+"?query=",//+encodeURIComponent(q),
    type:"post",
    data:q, //将具体操作放在数据内
    headers:{
        "content-type": "text/plain; charset=utf-8", // 直接提交raw数据
        "Authorization":"Basic ZGVmYXVsdDohQG1AbjA1"
        //"Authorization":app.config.ck_options.auth
    },         
    success:function(json){
      console.log("===featured item saved.===\n",json);
    }
  });    
}


//将item显示到页面
function showContent(item){
    //左侧：
    //标题与摘要
    $("#content").append("<div class='title'><a id='jumplink' href='#'>"+item.title+"</a></div>");//标题
    if(item.summary && item.summary.length>0)$("#content").append("<div class='summary'>"+item.summary+"</div>");//摘要
    // 标签
    //正文及图片
    for(var i=0;i<item.images.length;i++){
        $("#gallery").append("<li><img src='" + item.images[i].replace(/\.avif/,'') + "' alt=''/></li>");//加载图片幻灯
        $("#content").append("<img src='" + item.images[i].replace(/\.avif/,'') + "'/>");//正文图片
        base64Img(item.images[i]);//将图片转换为base64为上传做准备
    }

    if(item.logo && item.images.indexOf(item.logo)<0){ //如果logo是独立图片，也加入
        base64Img(item.logo);//将图片转换为base64为上传做准备
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

    //达人佣金
    var profitHtml = htmlItemProfitTags(stuff);
    if(profitHtml.trim().length>0){
        $("#profit").html(profitHtml);
        $("#profit").toggleClass("profit-hide",false);
        $("#profit").toggleClass("profit-show",true);
    }
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
        //根据填写结果组织property：注意统一组织为json对象，而不是数组
        var props = {};
        for(var k in nodes){
            var node = nodes[k];
            var key = node.property;
            props[key] = node.value;
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

        //logo
        var logo = $("#logo").val()?$("#logo").val():"";
        //标签和链接
        var tagging = $("#tagging").val()?$("#tagging").val():"";
        var web2link = $("#web2link").val()?$("#web2link").val():"";
        var wap2link = $("#wap2link").val()?$("#wap2link").val():"";
        if(stuff.meta && stuff.meta.category /*&& tagging.trim().length>0*/ && ((web2link.trim().length>0 && wap2link.trim().length>0) || item.link.qrcode)) {
            stuff.logo = logo;
            stuff.tagging = tagging;
            stuff.link.web2 = web2link;
            stuff.link.wap2 = wap2link;
            stuff.task.status = "indexed";
            stuff.status.load = "pending";//提交后需要重新分析
            stuff.status.index = "pending";//提交后需要重新索引

            //然后索引
            console.log("now start commit index.",stuff);
            index(stuff);
        }else{
            siiimpleToast.message('类目、推广链接不能为空',{
              position: 'bottom|center'
            });            
        }
    }); 
    //删除按钮：点击后更改状态：inactive
    $("#cancelbtn").click(function(){
        stuff.status.inactive = "inactive";
        stuff.status.index = "pending";//提交后需要重新索引
        stuff.timestamp.inactive = new Date();//更新时间戳
        index(stuff);
    });   
    //重新评价按钮：点击后重新提交，需要设置remeasure=true
    $("#remeasurebtn").click(function(){
        var nStuff = JSON.parse(JSON.stringify(stuff));
        nStuff["remeasure"] = true;
        console.log("try remeasure item.",nStuff);
        index(nStuff);
    });      
    //itemKey：便于检查对照
    $("#itemkey").val(item._key); 
    $("#itemkey").attr("data-clipboard-text",item._key); 
    var clipboard = new ClipboardJS('#itemkey'); //提供点击复制功能
    clipboard.on('success', function(e) {
        console.info('itemKey copied:', e.text);
        siiimpleToast.message('itemKey已复制~~',{
              position: 'bottom|center'
            }); 
    });     
    //logo图片
    $("#logo").val(item.logo?item.logo:item.images[0]);     
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
    //注册批量更新stuff类目按钮
    $("#btnBatchUpdateStuff").click(function(){
        batchUpdateStuffCategory(stuff);//根据当前设置批量修改其他同类目stuff
        //batchUpdatePlatformCategories(stuff);//根据当前设置批量修改其他同类目platform_categories
    });

    //装载客观评价维度及得分
    if(item.meta && item.meta.category){
    	loadMeasureAndScore();//加载客观评价
        loadMeasureAndScore2();//加载主观评价内容
    }

    //显示客观评价结果图表
    if(item.media && item.media.measure){
        $("#radarImg").empty();
        $("#radarImg").append("<img style='object-fill:cover;width:100%' src='"+item.media.measure+"'/>");
        $("#radarTitle").css("display","block");
    }
    if(item.media && item.media.mondrian){
        $("#mondrianImg").empty();
        $("#mondrianImg").append("<img style='object-fill:cover;width:100%' src='"+item.media.mondrian+"'/>");
        $("#mondrianTitle").css("display","block");
    }    
    if(item.media && item.media["measure-scheme"]){
        $("#sunburstImg").empty();
        $("#sunburstImg").append("<img style='object-fill:cover;width:100%' src='"+item.media["measure-scheme"]+"'/>");
        $("#sunburstTitle").css("display","block");
    }
    //显示主观评价结果图表
    if(item.media && item.media.measure2){
        $("#radarImg2").empty();
        $("#radarImg2").append("<img style='object-fill:cover;width:100%' src='"+item.media.measure2+"'/>");
        $("#radarTitle2").css("display","block");
    }    

    //显示海报
    var total = 0;
    for(j in item.poster){
        var posterUrl = item.poster[j];
        $("#poster").append("<div id='poster"+j+"' class='prop-row'><img style='object-fill:cover;width:100%' src='"+posterUrl+"'/></div>");
        total ++;
    }
    if(total>0)
        $("#posterTitle").css("display","block");

    //生成文案
    requestAdviceScheme();

    //注册评价图表生成事件
    $("#btnMeasure").click(function(){
        var chartType = $("#measureScheme").val();
        //显示评价树
        if(stuff.meta && stuff.meta.category){
            if("radar"==chartType){
                $("#radarImg").css("display","none");//隐藏原有图片
                showRadar();//显示客观评价图
            }else if("mondrian"==chartType){//生成蒙德里安格子图
                $("#mondrian").empty();
                $("#mondrianImg").css("display","none");//隐藏原有图片
                showDimensionMondrian();
            }else if("sunburst"==chartType){
                $("#sunburstImg").css("display","none");//隐藏原有图片
                showDimensionBurst();//显示评价规则
                //showSunBurst({name:stuff.meta.categoryName?stuff.meta.categoryName:"评价规则",children:measureScheme});
            }else if("radar2"==chartType){
                $("#radarImg2").css("display","none");//隐藏原有图片
                showRadar2();//显示主观评价图
            }else{
                //do nothing
                console.log("wrong chart type.",chartType);
            }
        }
    });
    //注册海报生成事件
    $("#btnPoster").click(function(){
        //requestPosterScheme();//点击后重新生成海报
        //获取当前选中的海报
        var posterSchemeId = $("#posterScheme").val();
        console.log("got poster scheme.",posterSchemeId);
        //var scheme = JSON.parse($("#posterScheme").val());
        currentPosterScheme = posterSchemes[posterSchemeId];
        //requestPoster(scheme,broker,stuff,app.globalData.userInfo);//根据当前选择重新生成海报
        generateQrcode();//生成分享二维码后再生成海报
    });
    //注册图文内容生成事件
    requestArticleScheme();//获取图文模板列表
    $("#btnArticle").click(function(){
        requestArticle();
    });    
    //初始化tinyMCE编辑器
    tinymce.init({
        selector: '#article',
        branding: false,
        menubar: false,
        toolbar: [
            'styleselect | fontselect | fontsizeselect | bold italic underline strikethrough | link h2 h3 h4 blockquote | forecolor backcolor | link image | alignleft aligncenter alignright'
          ],
        plugins: 'autoresize',
        autoresize_bottom_margin: 50, 
        autoresize_max_height: 1000, // 编辑区域的最大高
        autoresize_min_height: 600, //编辑区域的最小高度
        autoresize_on_init: true,
        autoresize_overflow_padding: 50
      });

    //注册发布到wordpress事件
    $("#btnPublish").click(function(){
        publishArticle();
    });

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


//佣金
function htmlItemProfitTags(item){
    var profitTags = "";
    //因为已经确认过是达人，这里直接显示即可
    console.log("\n\n==profit==",item.profit);
    if(item.profit&&item.profit.type=="3-party"){//如果已经存在则直接加载
      if(item.profit&&item.profit.order){
          profitTags += "<span class='profitTipOrder'>店返</span><span class='itemTagProfitOrder' href='#'>¥"+(parseFloat((Math.floor(item.profit.order*10)/10).toFixed(1)))+"</span>";
          if(item.profit&&item.profit.team&&item.profit.team>0.1)profitTags += "<span class='profitTipTeam'>团返</span><span class='itemTagProfitTeam' href='#'>¥"+(parseFloat((Math.floor(item.profit.team*10)/10).toFixed(1)))+"</span>";
      }else if(item.profit&&item.profit.credit&&item.profit.credit>0){
          profitTags += "<span class='profitTipCredit'>积分</span><span class='itemTagProfitCredit' href='#'>"+(parseFloat((Math.floor(item.profit.credit*10)/10).toFixed(0)))+"</span>";
      }
    }else if(item.profit && item.profit.type=="2-party"){//如果是2方分润则请求计算
        profitTags = "<div id='profit"+item._key+"' class='itemTags profit-hide'></div>";
        getItemProfit2Party(item);
    }else{//表示尚未计算。需要请求计算得到该item的profit信息
        profitTags = "<div id='profit"+item._key+"' class='itemTags profit-hide'></div>";
        getItemProfit(item);
    }

    return profitTags;
}

//查询特定条目的佣金信息。返回order/team/credit三个值
function getItemProfit(item) {
    var data={
        source:item.source,
        price:item.price.sale,
        category:item.categoryId?item.categoryId:""
    };
    console.log("try to query item profit",data);
    util.AJAX(app.config.sx_api+"/mod/commissionScheme/rest/profit", function (res) {
        console.log("got profit info.",item,res);
        var showProfit = false;
        var html = "";
        if (res.order) {//店返
            html += "<span class='profitTipOrder'>店返</span><span class='itemTagProfitOrder' href='#'>¥"+(parseFloat((Math.floor(res.order*10)/10).toFixed(1)))+"</span>";
            if(res.team && res.team>0.1){//过小的团返不显示
                html += "<span class='profitTipTeam'>团返</span><span class='itemTagProfitTeam' href='#'>¥"+(parseFloat((Math.floor(res.team*10)/10).toFixed(1)))+"</span>";
            }
        }else if(res.credit&&res.credit>0){//如果没有现金则显示积分
            html += "<span class='profitTipCredit'>积分</span><span class='itemTagProfitCredit' href='#'>"+(parseFloat((Math.floor(res.credit*10)/10).toFixed(0)))+"</span>";
        }else{//这里应该是出了问题，既没有现金也没有积分
            console.log("===error===\nnothing to show.",item,res);
        }
        //显示到界面
        if(html.trim().length>0){
            $("#profit"+item._key).html(html);
            $("#profit"+item._key).toggleClass("profit-hide",false);
            $("#profit"+item._key).toggleClass("profit-show",true);
        }
        //更新到item
        if(item.profit==null){
          item.profit={};
        }        
        item.profit.order = res.order;
        item.profit.team = res.team;
        item.profit.credit = res.credit;
        item.profit.type = "3-party";   
        updateItem(item);       
    },"GET",data);
}

//查询佣金。2方分润。返回order/team/credit三个值
function getItemProfit2Party(item) {
    var data={
        source:item.source,
        price:item.price.sale,
        amount:item.profit.amount?item.profit.amount:0,
        category:item.categoryId?item.categoryId:""
    };
    console.log("try to query item profit -- 2 party",data);
    util.AJAX(app.config.sx_api+"/mod/commissionScheme/rest/profit-2-party", function (res) {
        console.log("got profit info.",item,res);
        var showProfit = false;
        var html = "";
        if (res.order) {//店返
            html += "<span class='profitTipOrder'>店返</span><span class='itemTagProfitOrder' href='#'>¥"+(parseFloat((Math.floor(res.order*10)/10).toFixed(1)))+"</span>";
            if(res.team && res.team>0.1){//过小的团返不显示
                html += "<span class='profitTipTeam'>团返</span><span class='itemTagProfitTeam' href='#'>¥"+(parseFloat((Math.floor(res.team*10)/10).toFixed(1)))+"</span>";
            }
        }else if(res.credit&&res.credit>0){//如果没有现金则显示积分
            html += "<span class='profitTipCredit'>积分</span><span class='itemTagProfitCredit' href='#'>"+(parseFloat((Math.floor(res.credit*10)/10).toFixed(0)))+"</span>";
        }else{//这里应该是出了问题，既没有现金也没有积分
            console.log("===error===\nnothing to show.",item,res);
        }
        //显示到界面
        if(html.trim().length>0){
            $("#profit"+item._key).html(html);
            $("#profit"+item._key).toggleClass("profit-hide",false);
            $("#profit"+item._key).toggleClass("profit-show",true);
        }
        //更新到item
        if(item.profit==null){
          item.profit={};
        }        
        item.profit.order = res.order;
        item.profit.team = res.team;
        item.profit.credit = res.credit;
        item.profit.type = "3-party";   
        updateItem(item);      
    },"GET",data);
}
//更新item信息。只用于更新profit
function updateItem(item) {
    var header={
        "Content-Type":"application/json",
        Authorization:"Basic aWxpZmU6aWxpZmU="
    };   
    var url = app.config.data_api +"/_api/document/my_stuff/"+item._key;
    if (app.globalData.isDebug) console.log("Info2::updateItem update item.",item);
    util.AJAX(url, function (res) {
      if (app.globalData.isDebug) console.log("Info2::updateItem update item finished.", res);
      //需要重新提交索引， 否则首页无法显示
      index(item);
    }, "PATCH", item, header);
}

//该方法提供给推荐语模板使用，获取特征指标的评价结果，返回JSON：{propKey: score}
function getItemScore(){
    var featuredPropScore = {};
    featuredDimension.forEach( prop =>{
        if(prop.propKey)featuredPropScore[prop.propKey] = itemScore[prop.id];//未定义propKey则不予考虑
        featuredPropScore[prop.name] = itemScore[prop.id];
    });
    return featuredPropScore;
}

var featuredDimension = [];//客观评价维度列表
var itemScore = {};//当前条目评分列表：手动修改后同时缓存
var categoryScore = {};//当前条目所在类目评分列表
var measureScores = [];//显示到grid供修改，在measure基础上增加score
var hasItemScore = false; //记录是否已获取商品评分
var hasCategoryScore = false; //记录是否已获取类目评分，即指定类目下商品的平均值
function loadMeasureAndScore(){
    //根据category获取客观评价数据
    var data = {
        categoryId:stuff.meta.category
    };
    util.AJAX(app.config.sx_api+"/mod/itemDimension/rest/dim-tree-by-category", function (res) {
        console.log("======\nload dimension.",data,res);
        if (res.length>0) {//本地存储评价数据
            measureScheme = res;
        }else{//没有则啥也不干
            //do nothing
            console.log("failed load dimension tree.",data);
        }
    },"GET",data); 

    //获取类目下的特征维度列表
    $.ajax({
        url:app.config.sx_api+"/mod/itemDimension/rest/featured-dimension",
        type:"get",
        //async:false,//同步调用
        data:{categoryId:stuff.meta.category},
        success:function(json){
            console.log("===got featured dimension===\n",json);
            featuredDimension = json;
            //准备默认值
            for(var i=0;i<json.length;i++){
            	var entry = json[i];
            	itemScore[entry.id] = (entry.score&&entry.score>0)?entry.score:0.75;
            	categoryScore[entry.id] = 0.5;
            }
            //查询已有标注值
            //根据itemKey获取评价结果
            //feature = 1；dimensionType：0客观评价，1主观评价
            //注意：由于clickhouse非严格唯一，需要取最后更新值
            $.ajax({
                url:app.config.analyze_api+"?query=select dimensionId,score from ilife.info where feature=1 and dimensionType=0 and itemKey='"+stuff._key+"' order by ts format JSON",
                type:"get",
                //async:false,//同步调用
                //data:{},
                headers:{
                    "Authorization":"Basic ZGVmYXVsdDohQG1AbjA1"
                },         
                success:function(ret){
                    console.log("===got item score===\n",ret);
                    for(var i=0;i<ret.rows;i++){
                        itemScore[ret.data[i].dimensionId] = ret.data[i].score;
                    }
                    console.log("===assemble item score===\n",itemScore);
                    hasItemScore = true;
                    pupulateMeasureScore();//展示数据到界面
                }
            }); 

        }
    });   

    //根据categoryId获取评价结果
    //feature = 1；dimensionType：0客观评价，1主观评价
    $.ajax({
        url:app.config.analyze_api+"?query=select dimensionId,avg(score) as score from ilife.info where feature=1 and dimensionType=0 and categoryId='"+stuff.meta.category+"' group by dimensionId format JSON",
        type:"get",
        //async:false,//同步调用
        //data:{},
        headers:{
            "Authorization":"Basic ZGVmYXVsdDohQG1AbjA1"
        },         
        success:function(json){
            console.log("===got category score===\n",json);
            for(var i=0;i<json.rows;i++){
                categoryScore[json.data[i].dimensionId] = json.data[i].score;
            }
            console.log("===assemble category score===\n",categoryScore);
            hasCategoryScore = true;//设置以获取类目评分
            pupulateMeasureScore();//显示到界面
        }
    }); 	


}

//在获取维度定义、商品评分、类目评分后组装展示到界面
function pupulateMeasureScore(){
    if(hasItemScore && hasCategoryScore){
        //组装measureScore
        for(var i=0;i<featuredDimension.length;i++){
            var measureScore = featuredDimension[i];
            measureScore.score = itemScore[measureScore.id]?itemScore[measureScore.id]:0.75;
            measureScores.push(measureScore);
        }

        //显示雷达图
        // if(!stuff.media || !stuff.media["measure"])//仅在第一次进入时才尝试自动生成
            showRadar();//显示评价图

        //显示measureScore表格提供标注功能
        showMeasureScores();        
    }
}


//该方法提供给推荐语模板使用，获取主观特征指标的评价结果，返回JSON：{propKey: score}
function getItemScore2(){
    var featuredPropScore = {};
    featuredDimension2.forEach( prop =>{
        if(prop.type)featuredPropScore[prop.type] = itemScore2[prop.id];//未定义type则不加载
        //featuredPropScore[prop.name] = itemScore2[prop.id];
    });
    return featuredPropScore;
}

//加载主观评价数据：
//是客观评价的重复代码：捂脸捂脸捂脸
var featuredDimension2 = [];//客观评价维度列表
var itemScore2 = {};//当前条目评分列表：手动修改后同时缓存
var categoryScore2 = {};//当前条目所在类目评分列表
var measureScores2 = [];//显示到grid供修改，在measure基础上增加score
var hasItemScore2 = false; //记录是否已获取商品评分
var hasCategoryScore2 = false; //记录是否已获取类目评分，即指定类目下商品的平均值
var defaultVals = {
    a:0.5,b:0.15,c:0.2,d:0.15,e:0.1,x:0.4,y:0.3,z:0.3
};//默认vals键值对
var dimNames2 = {
    a:"功能/功效",
    b:"质量/保障",
    c:"服务/售后",
    d:"品牌/认同",
    e:"稀缺性/个性化",
    x:"经济成本",
    y:"文化成本",
    z:"社会成本"
};
function loadMeasureAndScore2(){
    //根据category获取主观评价scheme
    var data = {
        categoryId:stuff.meta.category
    };
    util.AJAX(app.config.sx_api+"/mod/itemEvaluation/rest/dim-tree-by-category", function (res) {
        console.log("======\nload evaluation.",data,res);
        if (res.length>0) {//本地存储评价数据
            measureScheme2 = res;
        }else{//没有则啥也不干
            //do nothing
            console.log("failed load evalution tree.",data);
        }
    },"GET",data); 

    //获取类目下的特征维度列表
    $.ajax({
        url:app.config.sx_api+"/mod/itemEvaluation/rest/markable-featured-evaluation",
        type:"get",
        //async:false,//同步调用
        data:{categoryId:stuff.meta.category},
        success:function(json){
            console.log("===got featured evaluation===\n",json);
            featuredDimension2 = json;
            //按照字母序排序：根据type进行，排序结果为：abcdexyz
            featuredDimension2.sort(function (s1, s2) {
                x1 = s1.type;
                x2 = s2.type;
                if (x1 < x2) {
                    return -1;
                }
                if (x1 > x2) {
                    return 1;
                }
                return 0;
            });
            //准备默认值
            for(var i=0;i<json.length;i++){
                var entry = json[i];
                itemScore2[entry.id] = (entry.score&&entry.score>0)?entry.score:defaultVals[entry.type];
                categoryScore2[entry.id] = 0.5;//平均值直接设置为常数
            }
            //查询获取评价值
            //根据itemKey获取评价结果
            //feature = 1；dimensionType：0客观评价，1主观评价
            //注意：由于clickhouse非严格唯一，需要取最后更新值
            $.ajax({
                url:app.config.analyze_api+"?query=select dimensionId,score from ilife.info where feature=1 and dimensionType=1 and itemKey='"+stuff._key+"' order by ts format JSON",
                type:"get",
                //async:false,//同步调用
                //data:{},
                headers:{
                    "Authorization":"Basic ZGVmYXVsdDohQG1AbjA1"
                },         
                success:function(ret){
                    console.log("===got item score===\n",ret);
                    for(var i=0;i<ret.rows;i++){
                        itemScore2[ret.data[i].dimensionId] = ret.data[i].score;
                    }
                    console.log("===assemble item evaluation score===\n",itemScore2);
                    hasItemScore2 = true;
                    pupulateMeasureScore2();//显示到界面
                }
            });  
            
        }
    });  


    //根据categoryId获取评价结果
    //feature = 1；dimensionType：0客观评价，1主观评价
    $.ajax({
        url:app.config.analyze_api+"?query=select dimensionId,avg(score) as score from ilife.info where feature=1 and dimensionType=1 and categoryId='"+stuff.meta.category+"' group by dimensionId format JSON",
        type:"get",
        //async:false,//同步调用
        //data:{},
        headers:{
            "Authorization":"Basic ZGVmYXVsdDohQG1AbjA1"
        },         
        success:function(json){
            console.log("===got category score===\n",json);
            for(var i=0;i<json.rows;i++){
                categoryScore2[json.data[i].dimensionId] = json.data[i].score;
            }
            console.log("===assemble category score===\n",categoryScore2);
            hasCategoryScore2 = true;//设置已经获取类目平均值
            pupulateMeasureScore2();//显示到界面
        }
    });     


}

//在获取主观维度定义、商品评分、类目评分后组装展示到界面
function pupulateMeasureScore2(){
    if(hasItemScore2 && hasCategoryScore2){
        //组装measureScore
        for(var i=0;i<featuredDimension2.length;i++){
            var measureScore = featuredDimension2[i];
            measureScore.score = itemScore2[measureScore.id]?itemScore2[measureScore.id]:0.75;
            measureScores2.push(measureScore);
        }

        // if(!stuff.media || !stuff.media["measure2"])//仅在第一次进入时才尝试自动生成
            showRadar2();//显示评价图

        //显示measureScore表格提供标注功能
        showMeasureScores2();//主观评价      
    }
}


//generate and show radar chart
//TODO: to query result for specified item
//step1: query featured measures by meta.category
//step2: query calculated featured measure data by itemKey
//step3: assemble single item dataset
//step 4-6 : query and assemble category average data set
//step 7: show radar chart
function showRadar(){
    var margin = {top: 60, right: 60, bottom: 60, left: 60},
        width = Math.min(chartWidth, window.innerWidth - 10) - margin.left - margin.right,
        height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);
            
    //query item measure data
    var data = [];

    //未能获取维度列表则直接返回：页面装载后将立即加载维度评价及得分数据，此处仅判定是否已加载
    if(!featuredDimension || featuredDimension.length ==0)
        return;

    //显示标题：
    $("#radarTitle").css("display","block");

    //组装展示数据：根据维度遍历。
    var itemArray = [];
    var categoryArray = [];
    for(var i=0;i<featuredDimension.length;i++){
        var dimId = featuredDimension[i].id;
        var dimName = featuredDimension[i].name;
        
        itemArray.push({
            axis:dimName,
            value:itemScore[dimId]?itemScore[dimId]:0.5
        });
        categoryArray.push({
            axis:dimName,
            value:categoryScore[dimId]?categoryScore[dimId]:0.75
        });       
    }

    data = [];
    data.push(itemArray);
    data.push(categoryArray);

    //generate radar chart.
    //TODO: to put in ajax callback
    var color = d3.scaleOrdinal(["#CC333F","#EDC951","#00A0B0"]);
        
    var radarChartOptions = {
      w: width,
      h: height,
      margin: margin,
      maxValue: 1,
      levels: 5,
      roundStrokes: true,
      color: color
    };
    //genrate radar
    RadarChart("#radar", data, radarChartOptions);

    //将生成的客观评价图片提交到fdfs
    var canvas = $("#radar svg")[0];
    console.log("got canvas.",canvas);
    //调用方法转换即可，转换结果就是uri,
    var width = $(canvas).attr("width");
    var height = $(canvas).attr("height");
    var options = {
        encoderOptions:1,
        //encoderType:"image/jpeg",
        //scale:2,
        scale:1,
        left:0,
        top:0,
        width:Number(width),
        height:Number(height)
    };
    svgAsPngUri(canvas, options, function(uri) {
        //console.log("image uri.",dataURLtoFile(uri,"dimension.png"));
        //$("#radarImg").append('<img width="'+Number(width)+'" height="'+Number(height)+'" src="' + uri + '" alt="请长按保存"/>');
        //TODO： 将图片提交到服务器端。保存文件名为：itemKey-d.png
        base64Images.push(uri);//缓存用于推送
        uploadPngFile(uri, "measure-radra.png", "measure");//文件上传后将在stuff.media下增加{measure:imagepath}键值对
    });        
}

//生成客观评价蒙德里安格子图。每一个单品都值得拥有
//1，查询得到客观评价构成，包含id、名称、占比；包含关联的属性节点
//2，查询fact及info，得到已经计算的标注值
//3，组装treemap数据结构，如果没有计算值则根据标注反向计算
//4，生成格子图并显示
var itemInfos = null;//默认为null。如果返回为空则为空数组
function showDimensionMondrian(){
    //根据category获取客观评价数据
    var data={
        categoryId:stuff.meta.category
    };

    if(!measureScheme || measureScheme.length==0){
        console.log("try to load dimension data.",data);
        util.AJAX(app.config.sx_api+"/mod/itemDimension/rest/dim-tree-by-category", function (res) {
            console.log("======\nload dimension.",data,res);
            if (res.length>0) {//构建数据集
                measureScheme = res;
                buildMondrianDataset();
            }else{//没有则啥也不干
                //do nothing
                console.log("failed load dimension tree.",data);
            }
        },"GET",data);         
    }else{
        buildMondrianDataset();
    }
    
    //根据itemKey查询info
    $.ajax({
        url:app.config.analyze_api+"?query=select dimensionId,score from ilife.info where dimensionType=0 and itemKey='"+stuff._key+"' order by ts format JSON",
        type:"get",
        //data:{},
        headers:{
            "Authorization":"Basic ZGVmYXVsdDohQG1AbjA1"
        },         
        success:function(ret){
            console.log("===got item score===\n",ret);
            itemInfos = ret.data;
            buildMondrianDataset();
        }
    });     
}

//构建蒙德里安格子画数据集
//根据评价维度及评价数据得到
/**
{
    value:xxx,//根据总量计算得到
    color:xxx, //通过chooseMondrianColor得到
    children:xxx
}
//**/
var colorRatio = {red:0.2,yellow:0.4,blue:0.1,black:0.1};
function buildMondrianDataset(){
    if( !measureScheme || measureScheme.length==0 || !itemInfos )//注意仅检查评价结构，数据无需检查。itemInfos如果没有数据为：[]
        return;

    //先根据权重排序，仅取前4个高权重维度设置颜色比例
    measureScheme.sort(function (s1, s2) {
      x1 = s1.weight;
      x2 = s2.weight;
      if (x1 < x2) {
          return 1;
      }
      if (x1 > x2) {
          return -1;
      }
      return 0;
    });
    //根据顶级评价维度占比 设置 默认颜色方案，只考虑权重大的前4个
    var i=0;
    measureScheme.forEach(function(entry){
        if(i==0)colorRatio.red = entry.weight*0.1;
        if(i==1)colorRatio.yellow = entry.weight*0.1;
        if(i==2)colorRatio.blue = entry.weight*0.1;
        if(i==3)colorRatio.black = entry.weight*0.1;
        i++;
    });
    var mondrianData = {};
    mondrianData.value = 100;//顶部默认为100
    //mondrianData.color = chooseMondrianColor(colorRatio.red,colorRatio.yellow,colorRatio.blue,colorRatio.black);
    mondrianData.color = chooseMondrianColor(colorRatio);
    mondrianData.children = generateModrianData(measureScheme);//递归构建

    //生成图片
    showMondrian(mondrianData);
}

//递归生成数据
function generateModrianData(childMeasureScheme){
    //console.log("prepare mondrian record.",childMeasureScheme);
    var child = [];
    childMeasureScheme.forEach(function(entry){
        console.log("prepare mondrian record.",entry);
        var  node = {}; 
        node.value = entry.weight;
        //node.color = chooseMondrianColor(colorRatio.red,colorRatio.yellow,colorRatio.blue,colorRatio.black);
        node.color = chooseMondrianColor(colorRatio);
        if(entry.children && entry.children.length>0)
            node.children = generateModrianData(entry.children);//递归构建
        child.push(node);
    });
    return child;
}

function showMondrian(data){
    //显示标题：
    $("#mondrianTitle").css("display","block");
    //显示sunburst图表    
    Mondrian("#mondrian",data, {
      w: chartWidth,//默认为整屏宽度40%
      h: chartWidth*9/16//采用16:9
    });

    //将生成的客观评价图片提交到fdfs
    var canvas = $("#mondrian svg")[0];
    console.log("got canvas.",canvas);
    //调用方法转换即可，转换结果就是uri,
    var width = $(canvas).attr("width");
    var height = $(canvas).attr("height");
    var options = {
            encoderOptions:1,
            //scale:2,
            scale:1,
            //left:-1*Number(width)/2,
            //top:-1*Number(height)/2,
            left:0,
            top:0,
            width:Number(width),
            height:Number(height)
        };
    svgAsPngUri(canvas, options, function(uri) {
        //console.log("image uri.",dataURLtoFile(uri,"dimension.png"));
        //将图片提交到服务器端。保存文件文件key为：measure-scheme
        base64Images.push(uri);//缓存用于推送
        uploadPngFile(uri, "mondrian.png", "mondrian");//文件上传后将在stuff.media下增加{measure-scheme:imagepath}键值对
    });  
}

//主观评价雷达图显示
//这代码没法看，全是复制代码啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊
function showRadar2(){
    var margin = {top: 60, right: 60, bottom: 60, left: 60},
        width = Math.min(chartWidth, window.innerWidth - 10) - margin.left - margin.right,
        height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);
            
    //query item measure data
    var data = [];

    //未能获取维度列表则直接返回：页面装载后将立即加载维度评价及得分数据，此处仅判定是否已加载
    if(!featuredDimension2 || featuredDimension2.length ==0)
        return;

    //显示标题：
    $("#radarTitle2").css("display","block");

    //组装展示数据：根据维度遍历。
    var itemArray = [];
    var categoryArray = [];
    for(var i=0;i<featuredDimension2.length;i++){
        var dimId = featuredDimension2[i].id;
        //var dimName = featuredDimension2[i].type;
        var dimName = dimNames2[featuredDimension2[i].type];//采用友好名称
        console.log("got featured measure2 name",dimName);
        itemArray.push({
            axis:dimName,
            value:itemScore2[dimId]?itemScore2[dimId]:0.5
        });
        categoryArray.push({
            axis:dimName,
            value:categoryScore2[dimId]?categoryScore2[dimId]:0.75
        });       
    }

    data = [];
    data.push(itemArray);
    data.push(categoryArray);

    //generate radar chart.
    //TODO: to put in ajax callback
    var color = d3.scaleOrdinal(["#CC333F","#EDC951","#00A0B0"]);
        
    var radarChartOptions = {
      w: width,
      h: height,
      margin: margin,
      maxValue: 1,
      levels: 5,
      roundStrokes: true,
      color: color
    };
    //genrate radar
    RadarChart("#radar2", data, radarChartOptions);

    //将生成的客观评价图片提交到fdfs
    var canvas = $("#radar2 svg")[0];
    console.log("got canvas.",canvas);
    //调用方法转换即可，转换结果就是uri,
    var width = $(canvas).attr("width");
    var height = $(canvas).attr("height");
    var options = {
        encoderOptions:1,
        //encoderType:"image/jpeg",
        //scale:2,
        scale:1,
        left:0,
        top:0,
        width:Number(width),
        height:Number(height)
    };
    svgAsPngUri(canvas, options, function(uri) {
        //console.log("image uri.",dataURLtoFile(uri,"dimension.png"));
        //$("#radarImg").append('<img width="'+Number(width)+'" height="'+Number(height)+'" src="' + uri + '" alt="请长按保存"/>');
        //TODO： 将图片提交到服务器端。保存文件名为：itemKey-d.png
        base64Images.push(uri);//缓存用于推送
        uploadPngFile(uri, "measure-radra2.png", "measure2");//文件上传后将在stuff.media下增加{measure:imagepath}键值对
    });        
}

var brokerQrcode = null;//存放达人二维码url
var currentPosterScheme = null;//存放当前选中的海报模板
//生成短连接及二维码
/**
function generateQrcode(){
    console.log("start generate qrcode......");
    var longUrl = "https://www.biglistoflittlethings.com/ilife-web-wx/info2.html?fromBroker=system&posterId="
                        +currentPosterScheme.id+"&id="+stuff._key;//获取分享目标链接：包含itemKey及posterId
    var header={
        "Content-Type":"application/json"
    };
    util.AJAX(app.config.auth_api+"/wechat/ilife/short-url", function (res) {
        console.log("generate short url.",longUrl,res);
        var shortUrl = longUrl;
        if (res.status) {//获取短连接
            shortUrl = res.data.url;
        }
        //bug修复：qrcode在生成二维码时，如果链接长度是192-217之间会导致无法生成，需要手动补齐
        if(shortUrl.length>=192 && shortUrl.length <=217){
            shortUrl += "&placehold=fix-qrcode-bug-url-between-192-217";
        }
        console.log("generate qrcode by short url.[length]"+shortUrl.length,shortUrl);
        var qrcode = new QRCode("app-qrcode-box");
        qrcode.makeCode(shortUrl);
        setTimeout(uploadQrcode,300);//需要图片装载完成后才能获取 
    }, "POST", { "longUrl": longUrl },header);    
}
//**/

//生成短连接及二维码
function generateQrcode(){
    console.log("start generate qrcode......");
    var longUrl = "https://www.biglistoflittlethings.com/ilife-web-wx/info2.html?fromBroker=system&posterId="
                        +currentPosterScheme.id+"&id="+stuff._key;//获取分享目标链接：包含itemKey及posterId
    
    //生成短码并保存
    var shortCode = generateShortCode(longUrl);
    console.log("got short code",shortCode);
    saveShortCode(hex_md5(longUrl),stuff._key,'system','system',"mp",encodeURIComponent(longUrl),shortCode);    
    var shortUrl = "https://www.biglistoflittlethings.com/ilife-web-wx/s.html?s="+shortCode;//必须是全路径
    //var logoUrl = imgPrefix+app.globalData.userInfo.avatarUrl;//需要中转，否则会有跨域问题
    var logoUrl = "http://www.shouxinjk.net/static/logo/distributor-square/"+stuff.source+".png";//注意由于跨域问题，必须使用当前域名下的图片

    //生成二维码
    var qrcode = new QRCode(document.getElementById("app-qrcode-box"), {
        text: shortUrl,
        width: 96,
        height: 96,    
        drawer: 'png',
        logo: logoUrl,
        logoWidth: 24,
        logoHeight: 24,
        logoBackgroundColor: '#ffffff',
        logoBackgroundTransparent: false
    });  
    setTimeout(generateImage,1200);
}

//转换二维码svg为图片
function generateImage() {
    console.log("try generate image.");
    var canvas = $('#app-qrcode-box canvas');
    console.log(canvas);
    var img = canvas.get(0).toDataURL("image/png");

    //将二维码图片上传到fastdfs
    uploadQrcode(img, "qrcode"+stuff._key+currentPosterScheme.id+(new Date().getTime())+".png");//文件名称以itemKey+posterId+时间戳唯一识别

    //隐藏canvas
    jQuery("#app-qrcode-box canvas").css("display","none");
}

//上传二维码到poster服务器，便于生成使用
function uploadQrcode(dataurl, filename){
    //dataurl = $("#app-qrcode-box img").attr("src");
    //filename = "broker-qrcode-system.png";
    console.log("try to upload qrcode.",dataurl,filename);
    var formData = new FormData();
    formData.append("file", dataURLtoFile(dataurl, filename));//注意，使用files作为字段名
    $.ajax({
         type:'POST',
         url:app.config.poster_api+"/api/upload",
         data:formData,
         contentType:false,
         processData:false,//必须设置为false，不然不行
         dataType:"json",
         mimeType:"multipart/form-data",
         success:function(data){//把返回的数据更新到item
            console.log("qrcode file uploaded. try to update item info.",data);
            if(data.code ==0 && data.url.length>0 ){//仅在成功返回后才操作
                brokerQrcode = data.url;
                console.log("qrcode image.[url]"+app.config.poster_api+"/"+data.url);
                //生成海报
                requestPoster();//全部加载完成后显示海报
            }
         }
     }); 
}


//上传图片到fast-poster，便于海报生成
//**
function uploadPngFile(dataurl, filename, mediaKey){
    var formData = new FormData();
    formData.append("file", dataURLtoFile(dataurl, filename));//注意，使用files作为字段名
    if(stuff.media&&stuff.media[mediaKey]&&stuff.media[mediaKey].indexOf("group")>0){//已经生成过的会直接存储图片链接，链接中带有group信息
        var oldFileId = stuff.media[mediaKey].split("group")[1];//返回group后的字符串，后端将解析
        console.log("got old fileid.[fileId]"+oldFileId);
        formData.append("fileId", oldFileId);//传递之前已经存储的文件ID，即group之后的部分，后端根据该信息完成历史文件删除
    }else{
        formData.append("fileId", "");//否则设为空
    }
    $.ajax({
         type:'POST',
         url:app.config.poster_api+"/api/upload",
         data:formData,
         contentType:false,
         processData:false,//必须设置为false，不然不行
         dataType:"json",
         mimeType:"multipart/form-data",
         success:function(data){//把返回的数据更新到item
            console.log("chart file uploaded. try to update item info.",data);
            console.log("image path",app.config.poster_api+"/"+data.url);
            //将返回的media存放到stuff
            if(data.code ==0 && data.url.length>0 ){//仅在成功返回后才操作
                if(!stuff.media)
                    stuff.media = {};
                stuff.media[mediaKey] = app.config.poster_api+"/"+data.url;
                //submitItemForm();//提交修改
                //提交保存：有延后，避免频繁提交
                commitData(stuff, false,function(){
                    console.log("media image committed.");
                });                
                //更新图片地址，便于推送到微信群
                $("#"+mediaKey+"Img img").attr("src",app.config.poster_api+"/"+data.url);
            }
         }
     }); 
}
//**/

//上传图片文件到服务器端保存，用于海报生成
//mediaKey：用于指出在item.media下的key
/**
function uploadPngFile(dataurl, filename, mediaKey){
    var formData = new FormData();
    formData.append("files", dataURLtoFile(dataurl, filename));//注意，使用files作为字段名
    if(stuff.media&&stuff.media[mediaKey]&&stuff.media[mediaKey].indexOf("group")>0){//已经生成过的会直接存储图片链接，链接中带有group信息
        var oldFileId = stuff.media[mediaKey].split("group")[1];//返回group后的字符串，后端将解析
        console.log("got old fileid.[fileId]"+oldFileId);
        formData.append("fileId", oldFileId);//传递之前已经存储的文件ID，即group之后的部分，后端根据该信息完成历史文件删除
    }else{
        formData.append("fileId", "");//否则设为空
    }
    $.ajax({
         type:'POST',
         url:app.config.sx_api+"/rest/api/upload",
         data:formData,
         contentType:false,
         processData:false,//必须设置为false，不然不行
         dataType:"json",
         mimeType:"multipart/form-data",
         success:function(data){//把返回的数据更新到item
            console.log("chart file uploaded. try to update item info.",data);
            console.log("image path",app.config.file_api+"/"+data.fullpath);
            //将返回的media存放到stuff
            if(data.fullpath && data.group.length>0 && data.fullpath.length>6){//仅在成功返回后才操作
                if(!stuff.media)
                    stuff.media = {};
                stuff.media[mediaKey] = app.config.file_api+"/"+data.fullpath;
                submitItemForm();//提交修改
            }
         }
     }); 
}
//**/

//转换base64为png文件
function dataURLtoFile(dataurl, filename) {
  // 获取到base64编码
  const arr = dataurl.split(',')
  // 将base64编码转为字符串
  const bstr = window.atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n) // 创建初始化为0的，包含length个元素的无符号整型数组
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, {
    type: 'image/png',//固定为png格式
  })
}


//生成文案列表：请求文案列表，请求后直接生成文案
var advicesShowed = [];
function requestAdviceScheme(){
    //获取模板列表
    $.ajax({
        url:app.config.sx_api+"/mod/template/rest/item-templates",
        type:"get",
        data:{categoryId:stuff.meta.category},
        success:function(schemes){
            console.log("\n===got item advice schemes ===\n",schemes);
            //遍历并生成文案
            var total = 0;
            for(var i=0;i<schemes.length;i++){
                //将模板显示到界面，等待选择后生成
                requestAdvice(schemes[i]);
                total++;
            }
            if(total==0){
                $("#advice").append("<div>糟糕，还没有可用的文案哦~~</div>");//提示缺少文案定义
            }
            //支持前端手动添加的advice
            if(stuff.advice){
                for(key in stuff.advice){
                    if(advicesShowed.indexOf(key)<0 && stuff.advice[key].indexOf(":::")>0){//已经显示的就不再显示
                        //如果是达人推荐语，其结构为 达人昵称:::推荐语
                        var brokerAdvice = stuff.advice[key].split(":::");
                        //将文案显示到界面
                        $("#advice").append("<blockquote class='big-quote'><div class='prop-key'><strong style='font-size:12px;line-height:18px;'>"+brokerAdvice[0]+":</strong>&nbsp;&nbsp;<a id='sendWebhook"+key+"' href='#' style='font-size:12px;color:blue;'>发到运营群</a></div><div id='advice"+key+"' class='prop-row' style='font-size:12px;'>"+brokerAdvice[1]+"</div></blockquote>");  
                        //注册发送到企业微信群事件
                        $("#sendWebhook"+key).click(function(e){
                            var schemeId = $(this).attr("id").replace(/sendWebhook/g,"");
                            sendItemAdviceToWebhook($("#advice"+schemeId).text());
                        });                         
                    }
                }
            }
        }
    });  
}


//生成文案
function requestAdvice(scheme,xBroker,xItem,xUser){
    //判断海报模板是否匹配当前条目
    var isOk = false;
    if(scheme.condition && scheme.condition.length>0){//如果设置了适用条件则进行判断
        try{
            isOk = eval(scheme.condition);
        }catch(err){
            console.log("\n=== eval poster condition error===\n",err);
        }
    }else{//如果未设置条件则表示适用于所有商品
        isOk = true;
    }
    if(!isOk){//如果不满足则直接跳过
        console.log("condition not satisifed. ignore.");
        return;       
    }

    //检查是否已经生成，如果已经生成则不在重新生成
    /**
    if(stuff.advice && stuff.advice[scheme.id]){
        console.log("\n=== advice exists. ignore.===\n");
        return;
    }
    //**/

    //生成文案
    try{
        eval(scheme.expression);//注意：脚本中必须使用 var xAdvice=**定义结果
    }catch(err){
        return;//这里出错了就别玩了
    }
    //将文案显示到界面
    $("#advice").append("<blockquote class='big-quote'><div class='prop-key'><strong style='font-size:12px;line-height:18px;'>"+scheme.name+":</strong>&nbsp;&nbsp;<a id='sendWebhook"+scheme.id+"' href='#' style='font-size:12px;color:blue;'>发到运营群</a></div><div id='advice"+scheme.id+"' class='prop-row' style='font-size:12px;'>"+xAdvice+"</div></blockquote>");  
    advicesShowed.push(scheme.id);
    //注册发送到企业微信群事件
    $("#sendWebhook"+scheme.id).click(function(e){
        var schemeId = $(this).attr("id").replace(/sendWebhook/g,"");
        sendItemAdviceToWebhook($("#advice"+schemeId).text());
    });  
    //更新文案到stuff
    if(!stuff.advice)
        stuff.advice={};
    stuff.advice[scheme.id] = xAdvice;
    //submitItemForm();//提交修改: 
    //提交保存：有延后，避免频繁提交
    commitData(stuff, false,function(){
        console.log("advice committed.");
    });     
}

//生成图文内容：请求模板列表
function requestArticleScheme(){
    //获取模板列表
    $.ajax({
        url:app.config.sx_api+"/mod/viewTemplate/rest/listByType/item-article",
        type:"get",
        data:{},
        success:function(schemes){
            console.log("\n===got item article schemes ===\n",schemes);
            //遍历模板
            var total = 0;
            for(var i=0;i<schemes.length;i++){
                //将模板显示到界面，等待选择后生成
                $("#articleScheme").append("<option value='"+schemes[i].id+"'>"+schemes[i].name+"</option>");
                total++;
            }
            if(total>0){
                $("#articleScheme option:eq(0)").attr('selected', 'selected');//选中第一个
                $("#btnArticle").css('display', 'block');//显示生成按钮
            }
        }
    });  
}

//根据选中的模板生成当前商品的图文，并等待发布
function requestArticle(){
    var templateId = $("#articleScheme").val();
    var templateName = $("#articleScheme").find("option:selected").text();
    console.log("\n===try to generate article by template. ===\n",templateId);
    //生成html并显示到界面
    $.ajax({
        url:app.config.sx_api+"/rest/api/material-html",
        type:"post",
        data:JSON.stringify({
            templateId:templateId,
            item: stuff,
            measureScheme: measureScheme
        }),
        headers:{
            "Content-Type":"application/json"
        },        
        success:function(res){
            console.log("\n===got html article ===\n",res);
            //直接显示到界面
            //$("#article").empty();//先清空已有内容
            //$("#article").append(res.html);
            tinyMCE.activeEditor.setContent(res.html);
            //显示标题框及发布按钮
            $("#btnPublish").css("display","block");
            $("#postTitle").css("display","block");
            $("#postTitle").val(stuff.title+" - "+templateName);//默认采用商品标题 - 模板标题
        }
    });      
}

//发布文章到wordpress
function publishArticle(){
    var templateId = $("#articleScheme").val();//获取当前文章对应的ID
    var postTitle = $("#postTitle").val();//获取发布内容标题
    //var postContent = $("#article").html();//使用html作为内容
    var postContent = tinyMCE.activeEditor.getContent();
    console.log(" got content from editor.",postContent);
    //判断是否已经生成
    if(stuff.article && stuff.article[templateId]){//如果已经生成则直接更新，注意存储的是文章ID
        console.log("\n===try to update exists article. ===\n",stuff.article[templateId]);
        $.ajax({
            url:app.config.mp_api+"/wp-json/wp/v2/posts/"+stuff.article[templateId],
            type:"post",
            data:JSON.stringify({
                title:postTitle,
                content: postContent,
                status: "publish"
            }),
            headers:{
                "Content-Type":"application/json",
                "Authorization":sxConfig.options.mp_auth
            },        
            success:function(res){
                console.log("\n=== published ===\n",res);
                //推送到运营微信群
                //sendItemArticleToWebhook(res.id);//改为 手动发送
                //显示预览链接
                $("#btnPreview").attr("href",app.config.mp_api+"/archives/"+res.id);
                $("#btnPreview").attr("data-resId",res.id);
                $("#btnPreview").css("display","block");
                $("#sendWebhookArticle").css("display","block");
                //显示提示
                siiimpleToast.message('更新成功',{
                  position: 'bottom|center'
                });              
                //更新到stuff
                if(!stuff.article)
                    stuff.article={};
                stuff.article[templateId]=res.id;
                //submitItemForm();//提交修改
                //提交保存：有延后，避免频繁提交
                commitData(stuff, false,function(){
                    console.log("article committed.");
                }); 

                //提交文章到 索引
                var doc = createArticleDoc(res.id);
                indexArticleDoc(doc);

            }
        }); 
    }else{//否则生成新的文章，并且更新stuff.article
        console.log("\n===try to publish new article. ===\n");
        $.ajax({
            url:app.config.mp_api+"/wp-json/wp/v2/posts",
            type:"post",
            data:JSON.stringify({
                title:postTitle,
                content: postContent,
                status: "publish"
            }),
            headers:{
                "Content-Type":"application/json",
                "Authorization":sxConfig.options.mp_auth
            },        
            success:function(res){
                console.log("\n=== published ===\n",res);
                //推送到运营微信群
                //sendItemArticleToWebhook(res.id);//改为 手动发送
                //显示预览链接
                $("#btnPreview").attr("href",app.config.mp_api+"/archives/"+res.id);
                $("#btnPreview").attr("data-resId",res.id);
                $("#btnPreview").css("display","block");    
                $("#sendWebhookArticle").css("display","block");            
                //显示提示
                siiimpleToast.message('发布成功',{
                  position: 'bottom|center'
                });                
                //更新到stuff
                if(!stuff.article)
                    stuff.article={};
                stuff.article[templateId]=res.id;
                //submitItemForm();//提交修改
                //提交保存：有延后，避免频繁提交
                commitData(stuff, false,function(){
                    console.log("article committed.");
                });                 

                //提交文章到 索引
                var doc = createArticleDoc(res.id);
                indexArticleDoc(doc);                
            }
        }); 
    }
}

//建立Article索引doc
function createArticleDoc(articleId){

    console.log("try to build article doc.",articleId);
    var articleUrl = app.config.mp_api+"/archives/"+articleId;

    var templateId = $("#articleScheme").val();//获取当前文章对应的ID
    var postTitle = $("#postTitle").val();//获取发布内容标题
    //var postContent = $("#article").html();//使用html作为内容
    var postContent = tinyMCE.activeEditor.getContent();
    console.log(" got content from editor.",postContent);

    //合并tags及tagging
    var tags  = [];
    if(stuff.tags){
        stuff.tags.forEach(function(item){
            if(tags.indexOf(item)<0)tags.push(item);
        });
    }
    if(stuff.tagging){
        stuff.tagging.forEach(function(item){
            if(tags.indexOf(item)<0)tags.push(item);
        });
    }
    if(stuff.meta && stuff.meta.categoryName && stuff.meta.categoryName.trim().length > 0){
        var metaCategory = stuff.meta.categoryName.split("/");
        metaCategory.forEach(function(item){
            if(tags.indexOf(item)<0)tags.push(item);
        });
    }

    //装配索引文档
    var doc = {
        source: stuff.source,
        type: "item" ,
        itemkey: stuff._key,   //单品直接用itemKey，列表用boardId
        template: templateId ,                               
        url: articleUrl,
        title: postTitle,
        summary: stuff.summary + " "+ postContent, //一股脑扔进去就可以
        tags: tags,
        price: {
            currency: stuff.price.currency,
            bid: stuff.price.bid?stuff.price.bid:stuff.price.sale,
            sale: stuff.price.sale,
            profit: stuff.profit.order?stuff.profit.order:0,
            profit2: stuff.profit.team?stuff.profit.team:0
        },                
        logo: stuff.logo?stuff.logo:stuff.images[0].replace(/\.avif/,''),
        distributor: {
            country: stuff.distributor.country?sutff.distributor.country:"",
            language: stuff.distributor.language?stuff.distributor.language:"",
            name: stuff.distributor.name
        },
        timestamp: new Date()
    }

    return doc;
}

//提交索引。将整个文档提交ES建立所以，便于检索物料
function indexArticleDoc(doc){
    console.log("try to index article doc.",doc);
    var data = {
        records:[{
            value:doc
        }]
    };
    $.ajax({
        url:"http://kafka-rest.shouxinjk.net/topics/article",
        type:"post",
        data:JSON.stringify(data),//注意：不能使用JSON对象
        headers:{
            "Content-Type":"application/vnd.kafka.json.v2+json",
            "Accept":"application/vnd.kafka.v2+json"
        },
        success:function(result){
            siiimpleToast.message('图文索引已提交',{
                  position: 'bottom|center'
                });
        }
    }) 
}

//发送图文信息到运营群：运营团队收到新内容提示
function sendItemArticleToWebhook(articleId=''){
    //推动图文内容到企业微信群，便于转发
    var msg = {
            "msgtype": "news",
            "news": {
               "articles" : [
                   {
                       "title" : stuff.distributor.name + (stuff.meta&&stuff.meta.categoryName?stuff.meta.categoryName:'')+"单品图文上新",
                       "description" : stuff.title,
                       "url" : "https://www.biglistoflittlethings.com/ilife-web-wx/content.html?id="+articleId,//将跳转到content.html附加浏览用户的formUser、fromBroker信息
                       "picurl" : stuff.logo?stuff.logo:stuff.images[0].replace(/\.avif/,'')
                   }
                ]
            }
        };

    //推送到企业微信
    console.log("\n===try to sent webhook msg. ===\n",msg);
    $.ajax({
        url:app.config.wechat_cp_api+"/wework/ilife/notify-cp-company-broker",
        type:"post",
        data:JSON.stringify(msg),
        headers:{
            "Content-Type":"application/json"
        },        
        success:function(res){
            console.log("\n=== webhook message sent. ===\n",res);
            siiimpleToast.message('欧耶，发送成功',{
              position: 'bottom|center'
            }); 
        }
    });     
}


//生成商品海报：先获得海报列表
function requestPosterScheme(){
    //仅对已经确定类目的商品进行
    if(!stuff.meta || !stuff.meta.category)
        return;

    $.ajax({
        url:app.config.sx_api+"/mod/posterTemplate/rest/item-templates",
        type:"get",
        data:{categoryId:stuff.meta.category},
        success:function(schemes){
            console.log("\n===got item poster scheme ===\n",schemes);
            //遍历海报并生成
            for(var i=0;i<schemes.length;i++){
                //传递broker/stuff/userInfo作为海报生成参数
                //requestPoster(schemes[i],broker,stuff,app.globalData.userInfo);
                //将海报列表填写到选择器，可以根据需要选择生成
               //遍历模板
                var total = 0;
                for(var i=0;i<schemes.length;i++){
                    //将模板显示到界面，等待选择后生成：注意将scheme json作为value
                    //$("#posterScheme").append("<option value='"+JSON.stringify(schemes[i])+"'>"+schemes[i].name+"</option>");
                    posterSchemes[schemes[i].id] = schemes[i];//记录poster定义
                    $("#posterScheme").append("<option value='"+schemes[i].id+"'>"+schemes[i].name+"</option>");
                    total++;
                }
                if(total>0){
                    $("#posterScheme option:eq(0)").attr('selected', 'selected');//选中第一个
                    $("#btnPoster").css('display', 'block');//显示生成按钮
                }
            }
        }
    });  
}

//生成海报，返回海报图片URL
//注意：海报模板中适用条件及参数仅能引用这三个参数
function requestPoster(scheme,xBroker,xItem,xUser){
    if(!scheme)
        scheme = currentPosterScheme;
    //判断海报模板是否匹配当前条目
    var isOk = true;
    if(scheme.condition && scheme.condition.length>0){//如果设置了适用条件则进行判断
        console.log("\n===try eval poster condition===\n",scheme.condition);
        try{
            isOk = eval(scheme.condition);
        }catch(err){
            console.log("\n=== eval poster condition error===\n",err);
        }
        console.log("\n===result eval poster condition===\n",isOk);
    }
    if(!isOk){//如果不满足则直接跳过
        console.log("condition not satisifed. ignore.");
        siiimpleToast.message('条件不满足，请检查海报引用的图片是否已生成。',{
              position: 'bottom|center'
            }); 
        return;       
    }

    //检查是否已经生成，如果已经生成则不在重新生成
    /**
    if(stuff.poster && stuff.poster[scheme.id]){
        console.log("\n=== poster exists. ignore.===\n");
        return;
    }
    //**/

    //准备海报参数
    console.log("\n===try eval poster options===\n",scheme.options);
    try{
        eval(scheme.options);//注意：脚本中必须使用 var xParam = {}形式赋值
    }catch(err){
        console.log("\n=== eval poster options error===\n",err);
        return;//这里出错了就别玩了
    }
    console.log("\n===eval poster options===\n",xParam);
    var options = {//merge参数配置
                  ...app.config.poster_options,//静态参数：accessKey、accessSecret信息
                  ...xParam //动态参数：配置时定义
                }
    console.log("\n===start request poster with options===\n",options);
    //请求生成海报
    $.ajax({
        url:app.config.poster_api+"/api/link",
        type:"post",
        data:JSON.stringify(options),
        success:function(res){
            console.log("\n===got item poster info ===\n",res);
            //将海报信息更新到stuff
            if(res.code==0 && res.url && res.url.length>0){
                if(!stuff.poster)
                    stuff.poster = {};
                stuff.poster[scheme.id] = res.url;//以schemeId作为键值存储poster
                //sendItemMaterialToWebhook("海报",res.url,res.url);//发送海报到企业微信群：确定后手动选择发送，不自动发送，减少信息量
                //submitItemForm();//提交修改
                //提交保存：有延后，避免频繁提交
                commitData(stuff, false,function(){
                    console.log("poster image committed.");
                });                 
                //显示到界面
                var showPoster = true;
                if(showPoster){
                    //$("#poster"+scheme.id).remove();//删除old海报图片
                    $("#poster").empty();//清空
                    $("#poster").append("<div id='poster"+scheme.id+"' class='prop-row'><img style='object-fill:cover;width:100%' src='"+res.url+"'/></div>");
                    $("#posterTitle").css("display","block"); 
                }
            }
        }
    });     
}

//发送信息到运营群：运营团队收到新内容提示
//发送卡片：其链接为图片地址
function sendItemMaterialToWebhook(title,url,imgUrl){
    //推动图文内容到企业微信群，便于转发
    var msg = {
            "msgtype": "news",
            "news": {
               "articles" : [
                   {
                       "title" : stuff.distributor.name + (stuff.meta&&stuff.meta.categoryName?stuff.meta.categoryName:'')+ title,
                       "description" : stuff.title,
                       "url" : url,
                       "picurl" : imgUrl
                   }
                ]
            }
        };

    //推送到企业微信
    console.log("\n===try to sent webhook msg. ===\n",msg);
    $.ajax({
        url:app.config.wechat_cp_api+"/wework/ilife/notify-cp-company-broker",
        type:"post",
        data:JSON.stringify(msg),
        headers:{
            "Content-Type":"application/json"
        },        
        success:function(res){
            console.log("\n=== webhook message sent. ===\n",res);
            siiimpleToast.message('欧耶，已经发送到运营群',{
                  position: 'bottom|center'
                }); 
        }
    });     
}

//发送信息到微博：
//包含一条推荐语，URL，以及图片。其中图片优先为评价结果，否则为商品摘要图片
var base64Images = [];//缓存生成的图表：当图表重新生成时均自动存入
function sendItemMaterialToWeibo(){
    //挑选一条推荐语：
    var statusText = stuff.title;
    var pendingTxts = [];
    if($("#tagging").val() && $("#tagging").val().trim().length > 0){
        statusText = $("#tagging").val()
    }else if(stuff.tagging && stuff.tagging.length>0 ){
        statusText = stuff.tagging;
    }else{
        if(stuff.advice && stuff.advice.length>0 ){ 
            Object.keys(stuff.advice).forEach(function(key){
                pendingTxts.push(stuff.advice[key]);
            });
        }
        if(pendingTxts.length>0){
            var idx = new Date().getTime() % pendingTxts.length;
            statusText = pendingTxts[idx];
        }
    }

    //挑选一个评价图片：根据已经转换得到的base64images随机得到一张
    var statusPic = null;
    if(base64Images.length>0){
        console.log("got base64 images. ",base64Images.length);
        var idx = new Date().getTime() % base64Images.length;
        statusPic = base64Images[idx];
    }else{//没有图片只能推送文字和链接
        console.log("no base64 images found. send text only");
    }
    //获取access token
    console.log("\n===try to sent weibo status. ===\n",statusText,statusPic);
    $.ajax({
        url:app.config.sx_api+"/rest/api/access-token/weibo",
        type:"get",     
        success:function(res){
            console.log("\n=== got weibo access token. ===\n",res);
            if(res.success){
                //组装multipart-form并发送
                console.log("try to upload status.",statusText,statusPic);
                var formData = new FormData();
                formData.append("access_token",res.token);
                formData.append("status",encodeURIComponent(statusText+" https://www.biglistoflittlethings.com/ilife-web-wx/go.html?id="+stuff._key));
                formData.append("rip","110.184.67.81");//real ip address
                /**
                if(statusPic)
                    formData.append("pic", dataURLtoFile(statusPic, stuff.itemKey+".jpeg"));//注意，使用files作为字段名
                //**/
                
                //**
                for(var i=0; i<9 && i<base64Images.length; i++){
                    formData.append("pic", dataURLtoFile(base64Images[i], i+"0"+stuff.itemKey+".jpeg"), i+"0"+stuff.itemKey+".jpeg");//注意，使用files作为字段名
                }
                //**/
                $.ajax({
                     type:'POST',
                     url:"https://api.weibo.com/2/statuses/share.json",
                     data:formData,
                     contentType:false,
                     processData:false,//必须设置为false，不然不行
                     dataType:"json",
                     mimeType:"multipart/form-data",
                     success:function(ret){//把返回的数据更新到item
                        console.log("\n=== weibo msg sent. ===\n",ret);
                        siiimpleToast.message('欧耶，已经发送到微博',{
                              position: 'bottom|center'
                            }); 
                     },
                    error: function (xhr, textStatus, err) {//调用出错执行的函数
                        console.log("request sent but got error.",xhr,textStatus,err);
                      }
                 }); 
                              
            }else{
                siiimpleToast.message('获取access token失败',{
                      position: 'bottom|center'
                    });                 
            }

        }
    }); 
}

//将url图片转换为base64编码
//当前取消：该功能
function base64Img(url) {
    //donothing
}
/**
function base64Img(url) {
   var canvas = document.createElement('canvas');
   var ctx = canvas.getContext('2d');   
   var img = new Image();

    img.crossOrigin = 'Anonymous';
    img.onload = function(){
        if(img.height<200 || img.width<200){
            console.log("image is too small. ignore.");
        }else{
            canvas.height = img.height;
            canvas.width = img.width;
            ctx.drawImage(img,0,0);
            var dataURL = canvas.toDataURL('image/jpeg');
            if(dataURL && dataURL.trim().length>0){
                console.log("covert image done.", dataURL);
                base64Images.push(dataURL);
            }
        }
        canvas = null; 
    };
    img.src = url;
}
//**/

//发送文字信息到企业微信：用于发送推荐语等
//由运营人员选择后选择发送
function sendItemAdviceToWebhook(text){
    var msg =    {
                    "msgtype": "text",
                    "text": {
                        "content": text
                    }
               };

    //推送到企业微信
    console.log("\n===try to sent webhook msg. ===\n",msg);
    $.ajax({
        url:app.config.wechat_cp_api+"/wework/ilife/notify-cp-company-broker",
        type:"post",
        data:JSON.stringify(msg),
        headers:{
            "Content-Type":"application/json"
        },        
        success:function(res){
            console.log("\n=== webhook message sent. ===\n",res);
            console.log("submit item.[count]",totalSubmitItems);
            siiimpleToast.message('欧耶，发送成功',{
                  position: 'bottom|center'
                });             
        }
    });     
}

//图形化显示客观评价树
function showDimensionBurst(){
    //根据category获取客观评价数据
    var data={
        categoryId:stuff.meta.category
    };
    console.log("try to load dimension data.",data);
    util.AJAX(app.config.sx_api+"/mod/itemDimension/rest/dim-tree-by-category", function (res) {
        console.log("======\nload dimension.",data,res);
        if (res.length>0) {//显示图形
            measureScheme = res;
            showSunBurst({name:stuff.meta.categoryName?stuff.meta.categoryName:"评价规则",children:res});
        }else{//没有则啥也不干
            //do nothing
            console.log("failed load dimension tree.",data);
        }
    },"GET",data);    
}

function showSunBurst(data){
    //显示标题：
    $("#sunburstTitle").css("display","block");
    //显示sunburst图表    
    Sunburst("#sunburst",data, {
      value: d => d.weight, // weight 
      label: d => d.name, // name
      title: (d, n) => `${n.ancestors().reverse().map(d => d.data.name).join(".")}\n${n.value.toLocaleString("en")}`, // hover text
//      link: (d, n) => n.children
//        ? `https://github.com/prefuse/Flare/tree/master/flare/src/${n.ancestors().reverse().map(d => d.data.name).join("/")}`
//        : `https://github.com/prefuse/Flare/blob/master/flare/src/${n.ancestors().reverse().map(d => d.data.name).join("/")}.as`,
      width: 400,
      height: 400
    });

    //将生成的客观评价图片提交到fdfs
    var canvas = $("#sunburst svg")[0];
    console.log("got canvas.",canvas);
    //调用方法转换即可，转换结果就是uri,
    var width = $(canvas).attr("width");
    var height = $(canvas).attr("height");
    var options = {
            encoderOptions:1,
            //scale:2,
            scale:1,
            left:-1*Number(width)/2,
            top:-1*Number(height)/2,
            width:Number(width),
            height:Number(height)
        };
    svgAsPngUri(canvas, options, function(uri) {
        //console.log("image uri.",dataURLtoFile(uri,"dimension.png"));
        //将图片提交到服务器端。保存文件文件key为：measure-scheme
        base64Images.push(uri);//缓存用于推送
        uploadPngFile(uri, "measure-sunburst.png", "measure-scheme");//文件上传后将在stuff.media下增加{measure-scheme:imagepath}键值对
    });  
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
function index(item){
    //submitItemForm(item,true);
    //提交保存：有延后，避免频繁提交
    commitData(item,true, function(){
        console.log("index committed. now jump..."); 
    });    
}
/**
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
//**/

function submitItemForm(item=stuff, isJump=false){
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
            if(isJump){
                siiimpleToast.message('数据已保存',{
                      position: 'bottom|center'
                    });                
                window.location.href=indexPage+"?from=web"+(showAllItems?"&showAllItems=true":"")+(hideHeaderBar?"&hideHeaderBar=true":"")
                    +(stuff.meta&&stuff.meta.category?"&classify="+stuff.meta.category:"")
                    +(stuff.meta&&stuff.meta.categoryName?"&classifyName="+stuff.meta.categoryName:"");
            }
        }
    })     
}


//批量修改my_stuff
//将my_stuff中classify=pending,且source、category与当前stuff相同的同时修改
//TODO : 太耗时。需要调整为异步处理
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
            console.log("已更新所有同类目Stuff",result);
            siiimpleToast.message('已更新所有同类目商品',{
                  position: 'bottom|center'
                });
        }
    });
}

//批量修改my_stuff及platform_categories
//更新platform_categories中的设置条目：注意：由于my_stuff内无cid，不能采用insert方式，只用更新方式。另外，如果已经设置，则以此处更新优先
//TODO：需要修改为更新stuff，当前是更新category mapping
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
            siiimpleToast.message('已更新所有同类目商品',{
                  position: 'bottom|center'
                });            
        },
        error:function(){
            console.log("upsert failed.",platform_category);
        }
    }); 
}

//修改目录映射
function changeCategoryMapping(){
    var name = "";
    if(Array.isArray(stuff.category)){
        name = stuff.category[stuff.category.length-1];
    }else if(stuff.category){
        var array = stuff.category.split(" ");
        name = array[array.length-1];
    }
    var platform_category = {
        platform:stuff.source,
        name:name,
        categoryId:stuff.meta.category
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

//点击跳转到原始链接
function jump(item){//支持点击事件
    //console.log(item.id,item.url);
    logstash(item,"web","buy","system","system",function(){
        var target = item.url;
        if(item.link.web2){
            target = item.link.web2;
            //window.location.href = target;
            window.open(target,"_blank");
        }else if(item.link.web){
            target = item.link.web;
            //window.location.href = target;
            window.open(target,"_blank");
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
            console.log("got stuff data.",data);
            stuff = data;
            showContent(data);

            //显示评价树
            if(stuff.meta && stuff.meta.category){
                requestPosterScheme();//请求海报模板列表
                // if(!stuff.media || !stuff.media["measure-scheme"])//仅在第一次进入时才尝试自动生成
                    //showSunBurst({name:stuff.meta.categoryName?stuff.meta.categoryName:"评价规则",children:measureScheme});
                    showDimensionBurst();//显示评价规则
            }

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
        url:app.config.sx_api+"/mod/channel/rest/channels/active",
        type:"get",
        success:function(msg){
            var navObj = $(".navUl");
            for(var i = 0 ; i < msg.length ; i++){
                navObj.append("<li data='"+msg[i].id+"'>"+msg[i].name+"</li>");
                if(currentCategory == msg[i].id)//高亮显示当前选中的category
                    $(navObj.find("li")[i]).addClass("showNav");
            }
            //注册点击事件
            navObj.find("li").click(function(){
                var key = $(this).attr("data");
                //跳转到首页
                window.location.href = indexPage+"?category="+key;
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
            stuff.meta = {category:selectedCategory.id[0],categoryName:selectedCategory.label[selectedCategory.label.length-1]};//仅保存叶子节点
            stuff.status.classify = "ready";//更新classify状态classify
            stuff.timestamp.classify = new Date();//更新classify时间戳
            //增加类目标签
            patchCategoryTags(selectedCategory.id[0]);            
            //加载属性值列表
            loadProps(selectedCategory.id[0]);
            //更新类目映射：修改后直接提交修改
            changeCategoryMapping();            
            //显示批量更新stuff类目按钮：注意：由于是更改所有stuff，效率很低
            $("#btnBatchUpdateStuff").css("display","block");
        }
    });
    //对于已经设置的类目则直接显示属性列表
    if(stuff.meta && stuff.meta.category)
        loadProps(stuff.meta.category);
}

//获取指定类目信息，并将tag添加到tagging，便于标注
function patchCategoryTags(categoryId){
    console.log("try to query category tags.",categoryId);
    $.ajax({
        url:"https://data.shouxinjk.net/ilife/a/mod/itemCategory/rest/category/"+categoryId,
        type:"get",
        data:{},
        headers:{
            "Content-Type":"application/json",
            "Accept": "application/json"
        },
        success:function(res){
            console.log("got category detail.",res);
            //更新到stuff
            var tagging = $("#tagging").val();//以当前录入的tagging为主
            var currentTagging = [];
            if(tagging && tagging.trim().length>0)
                currentTagging = tagging.trim().split(" ");
            var categoryTags = res.tags?res.tags.split(" "):[];//采用空格分隔
            for(var i=0;i<categoryTags.length;i++){
                var categoryTag = categoryTags[i].trim();
                if(currentTagging.indexOf(categoryTag)<0)
                    currentTagging.push(categoryTag);
            }
            //更新到tagging显示框
            $("#tagging").val(currentTagging.join(" "));
        },
        error:function(){
            console.log("failed query category detail.",categoryId);
        }
    }); 
}

//解析json得到key value对
var docKeyValues = {};
function parseJsonKeyValues(json,prefix){
    Object.keys(json).forEach(function(key){
        //处理数值，或者递归到下一级
        if(json[key]){
            if( $.type(json[key])=== "object"){ //如果是对象则递归
                console.log("got plain object.",json[key]);
                parseJsonKeyValues(json[key],prefix+key+".");                
            }else if( $.type(json[key])=== "string"){ //如果是字符串值
                console.log("got string.",json[key]);
                docKeyValues[prefix+key] = json[key];//直接写入           
            }else if( $.type(json[key])=== "number"){ //如果是数值
                console.log("got number.",json[key]);
                docKeyValues[prefix+key] = json[key];//直接写入           
            }else if( $.type(json[key])=== "array"){ //如果是数组：当前不支持。已经在系统界面上单独提供
                console.log("got array.ignore.",json[key]);
                //docKeyValues[prefix+key] = json[key];//直接写入           
            }else{
                //ignore
                console.log("unknown object type.ignore.",json[key]);
            }
        }
    });
}

//根据ItemCategory类别，获取对应的属性配置，并与数据值融合显示
//1，根据key进行合并显示，以itemCategory下的属性为主，能够对应上的key显示绿色，否则显示红色
//2，数据显示，有对应于key的数值则直接显示，否则留空等待填写
function loadProps(categoryId){
    //根据categoryId获取所有measure清单，字段包括name、property
    $.ajax({
        url:"https://data.shouxinjk.net/ilife/a/mod/measure/measures?cascade=true&noPrefix=true&category="+categoryId,
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

            //加载json文档内的非props属性，用于自动填写。
            //解析后得到扁平键值对： key:value 。其中key为 xxx.xxx形式，value为单一值
            //由于需要修改，采用复制对象处理
            var nstuff = JSON.parse(JSON.stringify(stuff));
            delete nstuff.props;
            delete nstuff.status;
            delete nstuff.timestamp;
            delete nstuff.profit;
            delete nstuff.advice;
            delete nstuff.media;
            delete nstuff.link;
            delete nstuff.images;
            delete nstuff.task;
            delete nstuff.tags;
            delete nstuff.tagging;
            //delete nstuff.source;
            //delete nstuff.seller;
            //delete nstuff.distributor;
            parseJsonKeyValues(nstuff,"");//解析得到doc内的数值，得到键值对
            console.log("got doc key value pairs.",docKeyValues);
            //**/

            //逐条装载属性记录。采用自动补全方式便于快速标注。每个属性显示一行。
            //装载时需要进行区分：
            //如果属性是商品的props属性则直接修改props.xxx数值；如果属性是json文本上的属性则直接修改json文档，如price.bid
            //同时需要根据商品属性映射增加自动提示：包括手动标注、字典标注、引用标注，需要分别获取数值，对于自动标注则开放填写，不提供自动补全
            var propHtmlTpl = `
            <div style="display:flex;flex-direction:row;flex-wrap:nowrap;width:100%;margin:1px auto;">
                <div style="width:20%;line-height:30px;text-align:right;">__propName__propType</div>
                <div style="width:80%;vertical-align:middle;">
                    <input type="__type" value="__orgValue" id="__inputId" data-property="__property" data-targetproperty="__targetProperty" data-propname="__propName" data-ovalue="__orgValue" data-labeltype="__labelType" data-referdict="__referDict" data-refercategory="__referCategory" data-measureid="__measureId" style="width:100%;line-height:18px;margin:2px 5px;padding:2px;"/>
                </div>
            </div>
            `;                

              nodes = [];
              //先根据标准类目的属性组装，包含继承属性。
              //检查props内是否匹配，如果匹配则更新props下的属性，否则更新原始文档上的属性
              for( k in items ){
                /**
                if(Object.keys(docKeyValues).indexOf(k.property)>-1) //如果属性名和json自身的key值相同则忽略，表示已经在json文本内，不需要再次显示到props列表
                    continue;
                //**/

                var item = items[k];
                if(_sxdebug)console.log("measure:"+JSON.stringify(item) );
                if(item.isModifiable === "0") {//如果属性禁止手动修改则不显示
                    console.log("ignore not modifiable item.",item);
                    continue;
                }
                var name=item.name;
                var property = item.property;
                var value = props[property]?props[property]:"";
                //遍历props查找是否匹配，匹配包括两种情况，1键值匹配，包括带有props.的键值匹配，2键名匹配，包括带有props.前缀的键名匹配
                for(j in props){
                    var prop = props[j];
                    var _key = Object.keys(prop)[0];//得到当前prop的key值。注意没有props.前缀
                    if(_key===property || ("props."+_key)===property){//如果存在对应property：这是理想情况，多数情况下都只能通过name匹配
                        value = prop[_key];
                        props.splice(j, 1);//删除该元素，已经匹配上了，后续就不需要重复处理
                        break;
                    }else if(_key===name || ("props."+_key)===name){//如果匹配上name 也进行同样的处理
                        value = prop[_key];
                        props.splice(j, 1);//删除该元素，已经匹配上了，后续就不需要重复处理
                        break;
                    }
                }
                //根据是否有映射分别显示：已经匹配的则更新props.xxxx，否则更新关键属性上的xxx.xxxx
                var targetPropKey = property;//默认为采用标准属性上定义的propKey。注意：在建立标准属性时需要明确是文档属性，还是props.xxx扩展属性
                /**
                if(docKeys.indexOf(property)>0){ //检查property是否在json 的文档属性内，如果在则使用文档属性，否则认为是props下的扩展属性
                    targetPropKey = property; //使用原本的属性键值
                }
                //**/

                //检查默认值：对于数据值为空的情况优先设置默认值。禁用。当前defaultScore为单一数值，无法直接使用
                //注意：分别检查props.xxx 以及 非props.xxx
                if( /^props\./g.test(property) ){ //检查props.xxx
                    if( (!value || value.trim().length==0) && item.defaultValue && item.defaultValue.trim().length>0 ){ //数值为空，且有默认值
                        //先检查props.xxx 如果缺乏数值，则直接采用默认值填写
                        console.log("try set default value",value,item.defaultValue);
                        value = item.defaultValue; 
                        savePropValue(property, item.defaultValue, name);//同步提交保存
                    }
                }else{//检查非props.xxxx
                    if(Object.keys(docKeyValues).indexOf(property)>-1 && docKeyValues[property] && (""+docKeyValues[property]).trim().length > 0 ){ //优先从json的key-value pair中查询原来的数值
                        value = docKeyValues[property];
                        //已经是原来的值，不需要保存
                    }else if(item.defaultValue && item.defaultValue.trim().length>0 ){//如果kv键值对中没有，则检查是否有默认值，如果有则设置为默认值
                        value = item.defaultValue; 
                        savePropValue(property, item.defaultValue, name);//同步提交保存
                    }                    
                }

                //添加带自动补全功能HTML
                var propHtml = propHtmlTpl;
                var inputId = "propinput_"+targetPropKey.replace(/\./g,"_");
                if(item.labelType==="auto"){
                    propHtml = propHtml.replace(/__type/g,"number");//自动标注只能输入数字
                }else{
                    propHtml = propHtml.replace(/__type/g,"text");//否则自由输入
                }
                propHtml = propHtml.replace(/__propType/g,item.type=="self"?"๏":"○");
                propHtml = propHtml.replace(/__propName/g,name);
                propHtml = propHtml.replace(/__orgValue/g,value);
                propHtml = propHtml.replace(/__property/g,property);
                propHtml = propHtml.replace(/__targetProperty/g,targetPropKey);
                propHtml = propHtml.replace(/__inputId/g,inputId);
                propHtml = propHtml.replace(/__labelType/g,item.labelType);
                propHtml = propHtml.replace(/__referDict/g,item.referDict);
                propHtml = propHtml.replace(/__referCategory/g,item.referCategory);
                propHtml = propHtml.replace(/__measureId/g,item.id);
                propHtml = propHtml.replace(/__style/g,"");
                $("#propsList").append(propHtml);
                //增加自动补全功能，需要根据标准属性定义进行区分：字典标注、引用标注、手动标注。对于自动标注或设置缺失的则不提供自动补全
                if(item.labelType === "dict" && item.referDict && item.referDict.trim().length>0){ //字典标注
                    console.log("enable dict autocomplete", name, property, item.referDict, stuff.meta.category, item);
                    $("#"+inputId).autocomplete({
                        source: function (request, response) {
                            console.log("dict autocomplete",$(this)[0].element.data("propname"),$(this)[0].element.data("referdict"));
                            //查询字典值作为自动补全:注意要采用已经写入的值
                            $.ajax({
                                url:app.config.sx_api+"/mod/dictValue/rest/search/"+$(this)[0].element.data("referdict"),
                                type:"post",
                                data:JSON.stringify({
                                    categoryId:stuff.meta.category, //注意要使用stuff的标注类目，而不是标注属性上的类目，因为有继承属性
                                    q: request.term,
                                    size: 10 //默认提示10条
                                }),
                                headers:{
                                    "Content-Type":"application/json"
                                },        
                                success:function(res){
                                    console.log("\n===got dict value suggestions ===\n",res);
                                    response(res.data);
                                }
                            });
                        },
                        change: function( evt, ui ) { //修改后更新数值并自动提交
                            //console.log("try save",evt.currentTarget.id,evt.currentTarget.dataset.targetproperty,evt.currentTarget.dataset.ovalue,$("#"+evt.currentTarget.id).val());
                            var oValue = evt.currentTarget.dataset.ovalue;
                            var nValue = $("#"+evt.currentTarget.id).val();
                            var pName = evt.currentTarget.dataset.propname;
                            if(ui.item && ui.item.value && ui.item.value.trim().length>0){ //从推荐列表中选择：实际上这里不会被触发
                                console.log("try save dict measure with suggestion",evt.currentTarget.id,evt.currentTarget.dataset.targetproperty,ui.item.value,$("#"+evt.currentTarget.id).val(),pName);
                                savePropValue(evt.currentTarget.dataset.targetproperty, ui.item.value, pName);//使用选择的数值
                            }else if(nValue != oValue){ //判断数值是否被修改：检测是否和原始值不同，如果不同则认为被修改
                                console.log("try save dict measure value",evt.currentTarget.id,evt.currentTarget.dataset.targetproperty,oValue, nValue, pName);
                                savePropValue(evt.currentTarget.dataset.targetproperty, nValue, pName);//使用手动输入的数值
                            }else{
                                console.log("no changes. ignore.");
                            }
                        },                        
                        minLength: 0 //不输入任何值也能自动提示
                    });
                }else if(item.labelType === "manual"){ //手动标注
                    console.log("enable performance autocomplete", name, property, stuff.meta.category, item);
                    $("#"+inputId).autocomplete({
                        source: function (request, response) {
                            console.log("performance autocomplete",$(this)[0].element.data("propname"),$(this)[0].element.data("measureid"));
                            //查询用户标注值作为自动补全
                            $.ajax({
                                url:app.config.sx_api+"/ope/performance/rest/search/"+$(this)[0].element.data("measureid"),
                                type:"post",
                                data:JSON.stringify({
                                    categoryId:stuff.meta.category, //注意要使用stuff的标注类目，而不是标注属性上的类目，因为有继承属性
                                    q: request.term,
                                    size: 10 //默认提示10条
                                }),
                                headers:{
                                    "Content-Type":"application/json"
                                },        
                                success:function(res){
                                    console.log("\n===got performance value suggestions ===\n",res);
                                    response(res.data);
                                }
                            });
                        },
                        change: function( evt, ui ) { //修改后更新数值并自动提交
                            //console.log("try save",evt.currentTarget.id,evt.currentTarget.dataset.targetproperty,evt.currentTarget.dataset.ovalue,$("#"+evt.currentTarget.id).val());
                            var oValue = evt.currentTarget.dataset.ovalue;
                            var nValue = $("#"+evt.currentTarget.id).val();
                            var pName = evt.currentTarget.dataset.propname;
                            if(ui.item && ui.item.value && ui.item.value.trim().length>0){ //从推荐列表中选择：实际上这里不会被触发
                                console.log("try save dict measure with suggestion",evt.currentTarget.id,evt.currentTarget.dataset.targetproperty,ui.item.value,$("#"+evt.currentTarget.id).val(), pName);
                                savePropValue(evt.currentTarget.dataset.targetproperty, ui.item.value, pName);//使用选择的数值
                            }else if(nValue != oValue){ //判断数值是否被修改：检测是否和原始值不同，如果不同则认为被修改
                                console.log("try save dict measure value",evt.currentTarget.id,evt.currentTarget.dataset.targetproperty,oValue, nValue, pName);
                                savePropValue(evt.currentTarget.dataset.targetproperty, nValue, pName);//使用手动输入的数值
                            }else{
                                console.log("no changes. ignore.");
                            }
                        },                        
                        minLength: 0 //不输入任何值也能自动提示
                    });
                }else if(item.labelType === "refer" && item.referCategory && item.referCategory.trim().length>0){ //引用标注
                    console.log("enable refer autocomplete", name, property, item.referCategory, stuff.meta.category, item);
                    $("#"+inputId).autocomplete({
                        source: function (request, response) {
                            console.log("refer autocomplete",$(this)[0].element.data("propname"),$(this)[0].element.data("refercategory"));
                            //查询引用值作为自动补全
                            $.ajax({
                                url:app.config.data_api + "/_api/cursor",
                                type:"post",
                                data:JSON.stringify({
                                    query: 'For doc in my_stuff filter doc.meta.category=="'+$(this)[0].element.data("refercategory")+'"  and doc.title like "%'+request.term+'%" limit 10 return doc.title',
                                    count: false
                                }),//注意：不能使用JSON对象
                                headers:{
                                    "Content-Type":"application/json",
                                    "Accept":"application/json",
                                    Authorization:"Basic aWxpZmU6aWxpZmU="
                                },        
                                success:function(res){ //直接返回title列表
                                    console.log("\n===got dict value suggestions ===\n",res);
                                    response(res);
                                }
                            });
                        },
                        change: function( evt, ui ) { //修改后更新数值并自动提交
                            //console.log("try save",evt.currentTarget.id,evt.currentTarget.dataset.targetproperty,evt.currentTarget.dataset.ovalue,$("#"+evt.currentTarget.id).val());
                            var oValue = evt.currentTarget.dataset.ovalue;
                            var nValue = $("#"+evt.currentTarget.id).val();
                            var pName = evt.currentTarget.dataset.propname;
                            if(ui.item && ui.item.value && ui.item.value.trim().length>0){ //从推荐列表中选择：实际上这里不会被触发
                                console.log("try save dict measure with suggestion",evt.currentTarget.id,evt.currentTarget.dataset.targetproperty,ui.item.value,$("#"+evt.currentTarget.id).val(), pName);
                                savePropValue(evt.currentTarget.dataset.targetproperty, ui.item.value, pName);//使用选择的数值
                            }else if(nValue != oValue){ //判断数值是否被修改：检测是否和原始值不同，如果不同则认为被修改
                                console.log("try save dict measure value",evt.currentTarget.id,evt.currentTarget.dataset.targetproperty,oValue, nValue, pName);
                                savePropValue(evt.currentTarget.dataset.targetproperty, nValue, pName);//使用手动输入的数值
                            }else{
                                console.log("no changes. ignore.");
                            }
                        },                        
                        minLength: 0 //不输入任何值也能自动提示
                    });
                }else{//设置存在缺失，如设置为字典标注，但未设置字典。或者 自动标注，不提供自动补全功能
                    console.log("no autocomplete", name, property, item.labelType, stuff.meta.category, item);
                    $("#"+inputId).autocomplete({
                        source: [""],
                        change: function( evt, ui ) { //修改后更新数值并自动提交
                            //console.log("try save",evt.currentTarget.id,evt.currentTarget.dataset.targetproperty,evt.currentTarget.dataset.ovalue,$("#"+evt.currentTarget.id).val());
                            var oValue = evt.currentTarget.dataset.ovalue;
                            var nValue = $("#"+evt.currentTarget.id).val();
                            var pName = evt.currentTarget.dataset.propname;
                            if(ui.item && ui.item.value && ui.item.value.trim().length>0){ //从推荐列表中选择：实际上这里不会被触发
                                console.log("try save measure with suggestion",evt.currentTarget.id,evt.currentTarget.dataset.targetproperty,ui.item.value,$("#"+evt.currentTarget.id).val(),nValue, pName);
                                savePropValue(evt.currentTarget.dataset.targetproperty, ui.item.value, pName);//使用选择的数值
                            }else if(nValue != oValue){ //判断数值是否被修改：检测是否和原始值不同，如果不同则认为被修改
                                console.log("try save measure value",evt.currentTarget.id,evt.currentTarget.dataset.targetproperty,oValue, nValue, pName);
                                savePropValue(evt.currentTarget.dataset.targetproperty, nValue, pName);//使用手动输入的数值
                            }else{
                                console.log("no changes. ignore.");
                            }
                        },                          
                        minLength: 20 //不提供自动提示
                    });
                }
              }
              //添加未出现在标准类目映射中的property，即当前商品props中独有的属性。不提供自动补全。修改直接针对 props.xxx 进行
                for(j in props){
                    var prop = props[j];
                    if(_sxdebug)console.log("un matched prop:"+JSON.stringify(prop));
                    var property = Object.keys(prop)[0];
                    var value = prop[property];
                    var name = property ;//默认属性名称和属性的key一致

                    //可以严格控制不允许文本属性出现：如 price.currency 应该出现在采集文本内，而不是props属性下。否则会被分析系统认为是新的待标注属性
                    /**
                    if(docKeys.indexOf(property)>-1) //可以严格控制不允许文本属性出现：当前忽略
                        continue;       
                    //**/

                    var targetPropKey = "props."+property;//尚未在标准属性中定义的都认为是props.xxx扩展属性
                    
                    //添加带自动补全功能HTML
                    var propHtml = propHtmlTpl;
                    var inputId = "propinput_"+targetPropKey.replace(/\./g,"_");
                    propHtml = propHtml.replace(/__type/g,"text");//否则自由输入
                    propHtml = propHtml.replace(/__propType/g,"&nbsp");//无显示前缀
                    propHtml = propHtml.replace(/__propName/g,name);
                    propHtml = propHtml.replace(/__orgValue/g,value);
                    propHtml = propHtml.replace(/__property/g,property);
                    propHtml = propHtml.replace(/__targetProperty/g,targetPropKey);
                    propHtml = propHtml.replace(/__inputId/g,inputId);
                    propHtml = propHtml.replace(/__labelType/g,"");
                    propHtml = propHtml.replace(/__referDict/g,"");
                    propHtml = propHtml.replace(/__referCategory/g,"");
                    propHtml = propHtml.replace(/__measureId/g,"");
                    propHtml = propHtml.replace(/__style/g,"border-color:red;");
                    $("#propsList").append(propHtml);

                    console.log("ext prop item.", name, property, targetPropKey);
                    $("#"+inputId).autocomplete({
                        source: [""],
                        change: function( evt, ui ) { //修改后更新数值并自动提交
                            //console.log("try save",evt.currentTarget.id,evt.currentTarget.dataset.targetproperty,evt.currentTarget.dataset.ovalue,$("#"+evt.currentTarget.id).val());
                            var oValue = evt.currentTarget.dataset.ovalue;
                            var nValue = $("#"+evt.currentTarget.id).val();
                            var pName = evt.currentTarget.dataset.propname;
                            if(ui.item && ui.item.value && ui.item.value.trim().length>0){ //从推荐列表中选择：实际上这里不会被触发
                                console.log("try save ext prop value with suggestion",evt.currentTarget.id,evt.currentTarget.dataset.targetproperty,ui.item.value,$("#"+evt.currentTarget.id).val(),nValue,pName);
                                savePropValue(evt.currentTarget.dataset.targetproperty, ui.item.value, pName);//使用选择的数值
                            }else if(nValue != oValue){ //判断数值是否被修改：检测是否和原始值不同，如果不同则认为被修改
                                console.log("try save ext prop value",evt.currentTarget.id,evt.currentTarget.dataset.targetproperty,oValue, nValue, pName);
                                savePropValue(evt.currentTarget.dataset.targetproperty, nValue, pName);//使用手动输入的数值
                            }else{
                                console.log("no changes. ignore.");
                            }
                        },                          
                        minLength: 20 //不提供自动提示
                    });
                }
              if(_sxdebug)console.log("prop Nodes:"+JSON.stringify(nodes));  

            //显示属性列表
            $("#propsDiv").css("display","block");    

        }
    })     
}

//保存属性值：直接更新stuff对象。对于props对象更新时，需要同步清理doc属性，对于doc属性，需要同步删除props属性
function savePropValue(fullProperty, nValue, pName){
    console.log("try update stuff.",fullProperty,nValue,pName,JSON.parse(JSON.stringify(stuff)));
    var propChain = fullProperty.split(".");
    console.log("got parsed property", propChain, nValue, pName);
    var pattern = /props\./g;
    if(pattern.test(fullProperty)){ //是props下的扩展属性，更新props，并同步清理文档上的同key或同name属性
        if(!stuff.props)
            stuff.props = {};
        stuff.props[propChain[propChain.length-1]] = nValue;
        delete stuff[propChain[propChain.length-1]];
        delete stuff[pName];
    }else{//是文档上的非props属性。需要更新，并且清理props下的属性。注意可能有多层，需要遍历
        if(propChain.length ==1){
            stuff[propChain[0]] = nValue;
        }else if(propChain.length ==2){
            if(!stuff[propChain[0]])
                stuff[propChain[0]] = {};
            stuff[propChain[0]][propChain[1]] = nValue;
        }else if(propChain.length ==3){
            if(!stuff[propChain[0]])
                stuff[propChain[0]] = {};
            if(!stuff[propChain[0]][propChain[1]])
                stuff[propChain[0]][propChain[1]] = {};
            stuff[propChain[0]][propChain[1]][propChain[2]] = nValue;
        }else{
            console.log("property hierarchy must be 1-3.");
        }
        //删除props内的同名属性，只考虑一级
        if(stuff.props){
            delete stuff.props[fullProperty];
            delete stuff.props[pName];
        }
        
    }

    //提交保存：有延后，避免频繁提交
    commitData(stuff, false,function(){
        console.log("data saved.");
        /**
        siiimpleToast.message('数据已保存',{
          position: 'bottom|center'
        }); 
        //**/
    });
    console.log("stuff propvalue updated.",stuff);
}


//设置一个定时器延缓提交：默认30秒自动提交一次，避免频繁提交导致大量请求
//commitTimer
var _sxTimer = null;
var _sxDataReceived = null;//milliseconds while receiving data
var _sxDuration = 3000;//milliseconds from data received to commit
function commitData(data, isJump = false, callback){
    //set initially received time 
    if(!_sxDataReceived){
        _sxDataReceived = new Date().getTime();
    }    
    //check duration and clear timer
    if(_sxTimer && new Date().getTime()-_sxDataReceived < _sxDuration){
        console.log("try to clear timer for too frequent data commit.");
        clearTimeout(_sxTimer);   
        _sxTimer = null;
    }
    //(re)start a new timer to commit data
    _sxTimer = setTimeout(function(){
        console.log("commit data timer start.",data);
        //发起数据提交
        submitItemForm(data,isJump);
        if(callback && typeof callback === "function"){
            callback();
        }        
    },_sxDuration);    
    //设置数据接收时间
    _sxDataReceived = new Date().getTime();

}

//显示客观评价得分表格，便于手动修改调整
var tmpScores = {};
function showMeasureScores(){
	//准备评分表格：逐行显示
	for(var i=0;i<measureScores.length;i++){
		tmpScores[measureScores[i].id] = measureScores[i];
		var html = "";
		html += "<div style='display:flex;flex-direction:row;flex-wrap:nowrap;margin:10px 0;'>";
		html += "<div style='width:120px;line-height:24px;'>"+measureScores[i].name+"</div>";
		html += "<div style='width:60px;text-align:center;line-height:24px;' id='mscore"+measureScores[i].id+"'>"+measureScores[i].score.toFixed(2)+"</div>";
		html += "<div style='width:70%' id='score"+measureScores[i].id+"'></div>";
		html += "</div>";
		$("#measuresList").append(html);//装载到界面
		$("#score"+measureScores[i].id).starRating({//显示为starRating
			totalStars: 10,
			starSize:20,
		    useFullStars:false,//能够显示半星
		    initialRating: measureScores[i].score*10,//注意：评分是0-1,直接转换
		    ratedColors:['#8b0000', '#dc143c', '#ff4500', '#ff6347', '#1e90ff','#00ffff','#40e0d0','#9acd32','#32cd32','#228b22'],
		    callback: function(currentRating, el){
		        //获取当前评价指标
		        var measureId = $(el).attr("id").replace(/score/g,'');
		        var old = tmpScores[measureId];
		        console.log("dude, now try update rating.[old]",measureId,old,currentRating);
		        //保存到本地
		        var newScore = currentRating*0.1;//直接转换到0-1区间
		        itemScore[measureId] = newScore;
		        $("#mscore"+measureId).html(newScore.toFixed(2));
		        $("#radarImg").empty();//隐藏原有图片
		        showRadar();//重新生成雷达图

		        //提交数据并更新
		        var priority = old.parentIds.length - old.parentIds.replace(/\,/g,"").length;
			    $.ajax({
			        url:app.config.analyze_api+"?query=insert into ilife.info values ('"+stuff._key+"','"+stuff.meta.category+"','"+old.id+"','"+old.propKey+"',0,"+priority+",1,"+old.weight+",'"+old.script+"',"+newScore+",0,now())",
			        type:"post",
			        //data:{},
			        headers:{
			            "Authorization":"Basic ZGVmYXVsdDohQG1AbjA1"
			        },         
			        success:function(json){
			            console.log("===measure score updated===\n",json);
			        }
			    });  
		    }
		});		
	}
	//显示属性列表
	$("#measuresDiv").css("display","block");      
}

//显示主观评价得分表格，便于手动修改调整
//受不了啦：全是复制代码啊啊啊啊啊啊啊啊啊啊~~~~~~~~~~~
var tmpScores2 = {};
function showMeasureScores2(){
    //准备评分表格：逐行显示
    for(var i=0;i<measureScores2.length;i++){
        tmpScores2[measureScores2[i].id] = measureScores2[i];
        var html = "";
        html += "<div style='display:flex;flex-direction:row;flex-wrap:nowrap;margin:10px 0;'>";
        //html += "<div style='width:120px;line-height:24px;'>"+measureScores2[i].type+"</div>";
        html += "<div style='width:120px;line-height:24px;'>"+dimNames2[measureScores2[i].type]+"</div>"; //显示友好名称
        html += "<div style='width:60px;text-align:center;line-height:24px;' id='mscore2"+measureScores2[i].id+"'>"+measureScores2[i].score.toFixed(2)+"</div>";
        html += "<div style='width:70%' id='score2_"+measureScores2[i].id+"'></div>";
        html += "</div>";
        $("#measuresList2").append(html);//装载到界面
        $("#score2_"+measureScores2[i].id).starRating({//显示为starRating
            totalStars: 10,
            starSize:20,
            useFullStars:false,//能够显示半星
            initialRating: measureScores2[i].score*10,//注意：评分是0-1,直接转换
            ratedColors:['#8b0000', '#dc143c', '#ff4500', '#ff6347', '#1e90ff','#00ffff','#40e0d0','#9acd32','#32cd32','#228b22'],
            callback: function(currentRating, el){
                //获取当前评价指标
                var measureId = $(el).attr("id").replace(/score2_/g,'');
                var old = tmpScores2[measureId];
                console.log("dude, now try update evaluation rating.[old]",measureId,old,currentRating);
                //保存到本地
                var newScore = currentRating*0.1;//直接转换到0-1区间
                itemScore2[measureId] = newScore;
                $("#mscore2"+measureId).html(newScore.toFixed(2));
                $("#radarImg2").empty();//隐藏原有图片
                showRadar2();//重新生成雷达图

                //提交数据并更新
                var priority = old.parentIds.length - old.parentIds.replace(/\,/g,"").length;
                $.ajax({
                    url:app.config.analyze_api+"?query=insert into ilife.info values ('"+stuff._key+"','"+stuff.meta.category+"','"+old.id+"','"+old.propKey+"',1,"+priority+",1,"+old.weight+",'"+old.script+"',"+newScore+",1,now())",
                    type:"post",
                    //data:{},
                    headers:{
                        "Authorization":"Basic ZGVmYXVsdDohQG1AbjA1"
                    },         
                    success:function(json){
                        console.log("===measure score updated===\n",json);
                    }
                });  
            }
        });     
    }
    //显示属性列表
    $("#measuresDiv2").css("display","block");      
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


