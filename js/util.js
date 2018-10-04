
function getQuery() {
    //取得查询字符串并去掉开头的问号
    var qs = location.search.length > 0 ? location.search.substring(1):"";
    //保存数据的对象
    var args = {};
    //取得每一项
    var items = qs.length > 0 ? qs.split('&'):[];
    var item = null,name = null,value = null;
    for(var i = 0;i < items.length;i++) {
        item = items[i].split('=');
        name = decodeURIComponent(item[0]);
        value = decodeURIComponent(item[1]);
        if(name.length) {
            args[name] = value;
        }
    }
    return args;
}

function logstash(item,action,fn){//记录日志
    var target = item.url2?item.url2:item.url;
    var type = item.url2?"processed":"original";
    var data = {
        records:[{
            value:{
                user:"dummy",
                action:action,
                item:item._key,
                title:item.title,
                url:{
                    type:type,
                    target:target
                },
                timestamp:new Date()
            }
        }]
    };
    console.log("$.support.cors",$.support.cors);
    $.ajax({
        url:"http://kafka-rest.shouxinjk.net/topics/test",
        type:"post",
        data:JSON.stringify(data),//注意：不能使用JSON对象
        headers:{
            "Content-Type":"application/vnd.kafka.json.v2+json",
            "Accept":"application/vnd.kafka.v2+json"
        },
        success:function(result){
            fn(result);
        }
    })            
}
