// 文档加载完毕后执行
$(document).ready(function ()
{
    var args = getQuery();//获取参数
    var id = args["id"]?args["id"]:0;
    jump(id);
});

function jump(id){//获取详细内容
    $.ajax({
        url:"https://data.shouxinjk.net/_db/sea/my/stuff/"+id,
        type:"get",
        data:{},
        success:function(item){
            log(item,function(){window.location.href=item.url2?item.url2:item.url});
        }
    })            
}
