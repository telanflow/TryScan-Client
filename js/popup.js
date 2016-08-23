$(document).ready(function(){
	init();

    // 获取Client_ID
    $('#random_str').click(function(){
        var isOpen = Number(localStorage.getItem('isOpen'));
        if(!isOpen){
            var str = random_no();
            $('#client_id').val(str);
            localStorage.setItem('clientNo', str);
        }
    });

    // 监听按钮
    $('#btn-listen').click(function(){
        var flag = $.trim($(this).text()),
            host = $.trim($('#hosts').val()),
            server_address = $.trim($('#server_address').val()),
            client_no = $.trim($('#client_id').val());

        var aHost = host.split('\n'); // 域名数组
        var params = {
            isOpen: 0,
            hostList: aHost,
            server_address: server_address,
            client_no: client_no
        };

        switch(flag){
            case '开始监听':
                params.isOpen = 1;
                break;
            case '关闭监听':
                params.isOpen = 0;
                break;
            default:
                params.isOpen = 0;
        }

        // 发送消息
        sendBgMessage(params);
    });

    $('#hosts').change(function(){
        localStorage.setItem('hostList', $.trim($(this).val()));
    });

    $('#server_address').change(function(){
        localStorage.setItem('serverAddress', $.trim($(this).val()));
    });

    $('#client_id').blur(function(){
        localStorage.setItem('clientNo', $.trim($(this).val()));
    });
});

function init(){
    // 插件启动的时候获取一下localStorage中保存的值
    var isOpen = Number(localStorage.getItem('isOpen')),
        hostList = localStorage.getItem('hostList'),
        serverAddress = localStorage.getItem('serverAddress'),
        clientNo = localStorage.getItem('clientNo');

    $('#hosts').val(hostList);
    $('#client_id').val(clientNo);
    $('#server_address').val(serverAddress);

    //var isOpen=0;
    // 更新按钮状态
    updateBtnStatus(isOpen);
}

// 更新按钮状态
function updateBtnStatus(isTure)
{
    var btn_listen = $('#btn-listen'),
        hosts = $('#hosts'),
        address = $('#server_address'),
        client_no = $('#client_id');

	if( isTure ){
        btn_listen.text('关闭监听');
		btn_listen.removeClass('btn-info').addClass('btn-danger');
		hosts.attr('disabled','disabled');
        address.attr('disabled','disabled');
        client_no.attr('disabled','disabled');
	}else{
		btn_listen.text('开始监听');
		btn_listen.removeClass('btn-danger').addClass('btn-info');
		hosts.removeAttr('disabled');
        address.removeAttr('disabled');
        client_no.removeAttr('disabled');
	}
}

// 发送消息
function sendBgMessage(params)
{
	if( typeof(params.isOpen) != 'undefined' ){
		var isOpen = Number(params.isOpen);
		// 保存开关消息到localStorage
		localStorage.setItem('isOpen', isOpen);
		// 更新按钮状态
		updateBtnStatus(isOpen);
	}

	// 发送消息到background.js
	chrome.extension.sendMessage(params);
}

// 随机字符串
function random_no(len){
	len = len ? Number(len) : 7;
	var str = [];
	for(var i=0; i<len; i++){
		var n = Math.random()*(122-65+1)+65;
		if(n>90 && n<97){
			--i;
		}else{
			str.push(String.fromCharCode(n))
		}
	}
	return 'ts_' + str.join('');
}