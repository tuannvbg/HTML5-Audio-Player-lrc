$(function(){
	var $window = $(window),
        $body = $("body"),
		$header = $(".header"),
		$main = $(".main"),
		$playBox = $("#playBox"),
        $songInfo = $(".songInfo"),
        $songPrev = $("#songPrev"),
        $songPlay = $("#songPlay"),
        $songNext = $("#songNext"),
        $songCoverA = $songInfo.find(".songCover_box a"),
        $songCoverImg = $songInfo.find(".songCover_box img"),
        $songTitle = $songInfo.find(".songTitle"),
        $songArtist = $songInfo.find(".songArtist"),
        $currentTime = $songInfo.find(".currentTime"),
        $totalTime = $songInfo.find(".totalTime"),
        $songList = $(".songList"),
        $songListUl = $songList.find("ul"),
        $songProgress = $(".songProgress"),
        $loadProgress = $(".loadProgress"),
        $currentProgress = $(".currentProgress"),
        $lrc = $(".lrc"),
        $lrcUl = $lrc.find("ul"),
        $playConfig = $(".playConfig"),
        $bgConfig = $(".bgConfig"),
        $bgChangeBtn = $("#bgChangeBtn"),
        $bgList = $(".bgList"),
        $bgListUl = $(".bgList>ul");
    var player = {
            songList : [],
            config : {
                playType : localStorage.getItem("playType") || "list"
            },
            audio : new Audio(),
            currentID : -1,
            songPlaying : null,
            defaultArtist : "img/defaultArtist.jpg",
            getListUrl : "mp3.json",
            history : [],
            bg : {
                inited : false,
                id : localStorage.getItem("bgId") || 6,
                list : [
                    "http://pic.90sjimg.com/back_pic/u/00/02/82/06/5618aadb43b8e.jpg",
                    "http://pic1.win4000.com/wallpaper/6/54227a860266d.jpg",
                    "http://img15.3lian.com/2015/f1/80/d/93.jpg",
                    "http://img2.3lian.com/2014/f5/81/d/79.jpg",
                    "http://p19.qhimg.com/bdr/__/t0177904c1b77b3c256.jpg",
                    "http://img2.3lian.com/2014/f3/15/d/25.jpg",
                    "http://p15.qhimg.com/bdr/__/d/_open360/design0409/7.jpg",
                    "http://img2.3lian.com/2014/f4/209/d/90.jpg",
                    "http://www.pp3.cn/uploads/allimg/c111231/132531ST050-J0W.jpg"
                ]
            }
        };
    window.player = player;
    player.$audio = $(player.audio);
	$header.opts = {
		height : 52
	};
    $songInfo.opts = {
        height : 150
    }
    $songProgress.opts = {
        width : $songProgress.width()
    }
	function resize(){
		var W = $window.width(),
			H = $window.height(),
            palyBoxHeight = H-$header.opts.height;
		$main.height(palyBoxHeight);
        $songList.height(palyBoxHeight-$songInfo.opts.height);
	};resize();
    function getSongList(){
        return $.ajax({
            url : player.getListUrl,
            dataType : 'json'
        });
    };
    function getLrc(src){
        return $.ajax({
            url : src
        });
    }
    function pushSongList(){
        var html = '',
            list = player.songList.slice(0),
            tempArr = [];
        player.songList.forEach(function(value,index){
            var randomValue = list.splice(Math.floor(Math.random()*list.length),1)[0];
            html += '<li data-id="' + index + '">' +
                        '<a title="' + randomValue.title + '-' + randomValue.artist + '">' +
                            '<span class="title">' +
                                randomValue.title +
                            '</span>' +
                            ' - ' +
                            '<span class="artist">' +
                                randomValue.artist +
                            '</span>' +
                        '</a>' +
                    '</li>';
            tempArr.push(randomValue);
        });
        player.songList = tempArr;
        $songListUl.html(html);
    }
    function loadProgress(){
        try{
            var buffered = this.buffered,
                total = this.duration,
                start = buffered.start(0),
                end = buffered.end(0),
                progress = end/total*100;
            if ( !player.songList[player.currentID].duration ){
                pushTotalTime();
            }
            //console.log(progress);
            $loadProgress.width(progress+"%");
            if ( progress == 100 ){
                player.$audio.off("progress",loadProgress);
            } 
        }catch(e){

        }
    }
    function pushSongInfo(){
        var currentSongInfo = player.songList[player.currentID];
        $songTitle.html(currentSongInfo.title).attr('title',currentSongInfo.title);
        $songArtist.html(currentSongInfo.artist).attr('title',currentSongInfo.artist);
        $songCoverImg.attr('src', currentSongInfo.cover || player.defaultArtist);
        pushTotalTime();
    }
    function pushTotalTime(){
        var currentSongInfo = player.songList[player.currentID],
            duration = currentSongInfo.duration,
            time = "",
            minutes,seconds;
        if ( !duration ){
            if ( isNaN(player.audio.duration) ){
                $totalTime.html("00:00");
                return false;;
            }else{
                duration = currentSongInfo.duration = Math.ceil(player.audio.duration);
            }
        }
        var match = String(duration).match(/(\d*)([:：]?)(\d*)/);
        if ( !match ){
            time = "00:00"
        }else{
            if ( match[2] != "" ){
                minutes = pad(match[1]);
                seconds = pad(match[3]);
            }else{
                minutes = pad(parseInt(Number(match[1])/60));
                seconds = pad(Math.ceil(Number(match[1])%60));
            }
            time = minutes + ":" + seconds;
        }
        currentSongInfo.totalTimes = minutes*60 + Number(seconds);
        $totalTime.html(time);
    }
    function pad(num,size){
        size = size || 2;
        if ( Number(num) < Math.pow(10,size-1) ){
            return "0" + Number(num);
        }else{
            return num;
        }
    }
    function fix(num,size,isStr){
        size = size || 2;
        if ( isStr ){
            return Number(num).toFixed(size);
        }else{
            return Number(Number(num).toFixed(size));
        }
    }
    function songGoing(){
        if ( player.audio.currentTime >= player.audio.duration ){
            playStop();
            return false;
        }
        if ( player.audio.paused ){
            return false;
        }
        var currentSong = player.songList[player.currentID],
            currentTime = player.audio.currentTime,
            currentMs = currentTime*1000;
        if ( !currentSong.totalTimes ){
            $totalTime.html("00:00");
            $currentProgress.width(0);
        }else{
            var progress = fix(player.audio.currentTime/currentSong.totalTimes*100);
            //console.log(player.audio.currentTime);
            $currentProgress.width(progress+"%");
        }
        if ( currentSong.lrcFormat && currentSong.lrcFormat.ajax ){
            for (var i = 0,lrc = currentSong.lrcFormat.lrc.list,length = lrc.length; i < length; i++) {
                if ( currentMs >= lrc[i].time && ( i == length -1 || currentMs < lrc[i+1].time ) ){
                    if ( currentSong.lrcFormat.currentID === i ){
                        break;
                    }
                    currentSong.lrcFormat.currentID = i;
                    if ( i > 5 ){
                       $lrcUl.css("margin-top",-30*(i-5)+"px"); 
                    }else{
                        $lrcUl.css("margin-top",0);
                    }
                    $lrcUl.find('li[data-id="' + i + '"]').addClass('current').siblings().removeClass("current");
                    break;
                }
            };
        }
        $currentTime.html(pad(parseInt(Number(player.audio.currentTime)/60)) + ":" + pad(Math.ceil(Number(player.audio.currentTime)%60)));
        requestAnimationFrame(songGoing);
    }
    function songGo(){
        cancelAnimationFrame(player.songPlaying);
        player.songPlaying = requestAnimationFrame(songGoing);
    }
    function playStop(){
        player.audio.stop = true;
        cancelAnimationFrame(player.songPlaying);
        $lrcUl.css("margin-top",0);
        stopOrPlay(true);
        $songCoverA.removeClass('anim-pause anim-rotate');
        $currentProgress.width(0);
        $currentTime.html("00:00");
        songNext();
    }
    function playAction(id){
        if ( id !== player.history[player.history.length-1] ){
            player.history.push(id);
        }
        player.audio.stop = false;
        player.audio.src = player.songList[id].media;
        player.$audio.off("progress",loadProgress);
        player.$audio.on("progress",loadProgress);
        $songCoverA.addClass('anim-rotate');
        setTimeout(function(){
            $songCoverA.removeClass('anim-pause');
        },1000);
        pushSongInfo(player.currentID = id);
        stopOrPlay();
        songGo();
        if ( player.songList[id].lrcFormat ){
            $lrcUl.html(player.songList[id].lrcFormat.html);
        }else{
            if ( !player.songList[id].lrc ){
                player.songList[id].lrcFormat = {
                    list : ["暂无歌词"],
                    html : '<li class="lrc_noLrc">暂无歌词。。。</li>'
                };
                $lrcUl.html(player.songList[id].lrcFormat.html);
                return false;
            }
            getLrc(player.songList[id].lrc)
                .done(function(data){
                    player.songList[id].lrcFormat = lrcFormat(data);
                    $lrcUl.html(player.songList[id].lrcFormat.html);
                })
        }
    }
    function stopOrPlay(stop){
        if ( player.currentID === -1 ){
            return false;
        }
        if ( !player.audio.paused || stop === true ){
            $songCoverA.addClass('anim-pause');
            player.audio.pause();
            $songPlay.removeClass('icon_pause').addClass('icon_play');
            cancelAnimationFrame(player.songPlaying);
        }else{
            if ( player.audio.stop ){
                playAction(player.currentID);
                return false;
            }
            $songCoverA.removeClass('anim-pause');
            player.audio.play();
            $songPlay.removeClass('icon_play').addClass('icon_pause');
            player.songPlaying = requestAnimationFrame(songGoing);
        }
    }
    var lrcMatch = {
        ti : /\[ti[:：](.*)\]/, //歌名
        ar : /\[ar[:：](.*)\]/, //歌手
        al : /\[al[:：](.*)\]/, //专辑
        by : /\[by[:：](.*)\]/, //lrc作者
        offset : /\[offset[:：](-?\d*)\]/, //修正
        rowLyric : /((\[\d+[:：]\d+[\.:：]?\d*\])+)(.*)/, //分割每行的歌词
        times : /\[\d+[:：]\d+[\.:：]?\d*\]/g, //分割多个时间的行歌词
        time : /\[(\d+)[:：](\d+)[\.:：]?(\d*)\]/ //分割一个时间获取时分秒等
    }
    function lrcFormat(data){
        var format = {
            list : []
        };
        var rows = data.split("\n");
        var match;
        rows.forEach(function(value,index){
            if ( match = value.match(lrcMatch.ti) ){
                format.ti = match[1];
            }else if ( match = value.match(lrcMatch.ar) ){
                format.ar = match[1];
            }else if ( match = value.match(lrcMatch.al) ){
                format.al = match[1];
            }else if ( match = value.match(lrcMatch.by) ){
                format.by = match[1];
            }else if ( match = value.match(lrcMatch.offset) ){
                format.offset = match[1];
            }else if ( match = value.match(lrcMatch.rowLyric) ){
                var lrc = match[3];
                var times = match[1];
                var timeArr = times.match(lrcMatch.times);
                timeArr.forEach(function(v,k){
                    var m = v.match(lrcMatch.time);
                    format.list.push({
                        timeTag : v,
                        m : m[1],
                        s : m[2],
                        ms : m[3],
                        time : m[1]*60*1000 + m[2]*1000 + m[3]*10 + (parseInt(format.offset) || 0),
                        lrc : lrc
                    })
                });
            }
        });
        format.list.sort(function(a,b){
            return a.time - b.time;
        });
        //console.log(format);
        return {
            ajax : data,
            lrc : format,
            html : pushLrc(format)
        }
    }
    function pushLrc(data){
        var html = '';
        if ( data.ti ){
            html += '<li class="lrc_ti">歌曲名：' + data.ti + '</li>';
        }
        if ( data.ar ){
            html += '<li class="lrc_ar">歌手名：' + data.ar + '</li>';
        }
        if ( data.al ){
            html += '<li class="lrc_al">专辑名：' + data.al + '</li>';
        }
        if ( data.by ){
            html += '<li class="lrc_by">制作者：' + data.by + '</li>';
        }
        data.list.forEach(function(value,index){
            if ( index === 0 ){
                html += '<li class="lrc_first" data-id="' + index + '" data-time="' + value.time + '">' + value.lrc + '</li>'
            }else{
               html += '<li data-id="' + index + '" data-time="' + value.time + '">' + value.lrc + '</li>' 
            }
        });
        return html;
    }
    function clickProgress(e){
        if ( player.currentID === -1 || !player.audio.duration ){
            return false;
        }
        var x = e.offsetX,
            current = player.audio.duration*x/$songProgress.opts.width;
        player.audio.currentTime = current;
    }
    function songPrev(){
        if ( player.history.length > 1 ){
            playAction(player.currentID=player.history[player.history.length-2]);
        }else{
            playAction(player.currentID=(player.songList.length-1));
        }
        $songListUl.find("li").eq(player.currentID).addClass('current').siblings().removeClass('current');
    }
    function songNext(){
        stopOrPlay(true);
        switch (player.config.playType){
            case "one":
                playAction(player.currentID);
            break;
            case "list":
                if ( player.currentID === -1 || ++player.currentID >= player.songList.length ){
                    player.currentID = 0;
                }
                playAction(player.currentID);
            break;
            case "random":
                playAction(Math.floor(Math.random()*player.songList.length));
            break;
        }
        $songListUl.find("li").eq(player.currentID).addClass('current').siblings().removeClass('current');
    }
    function bgListShow(){
        if ( !player.bg.inited ){
            $bgListUl.html(pushBgList()).on("click","li",function(){
                var $t = $(this),
                    id = $t.data("id");
                $t.addClass('current').siblings().removeClass('current');
                $body.css('background-image','url(' + player.bg.list[player.bg.id = id] + ')');
                localStorage.setItem("bgId",id);
            });
            $bgListUl.find("li").eq(player.bg.id).addClass('current');
        }
        $bgConfig.toggleClass('current');
    }
    function pushBgList(){
        var html = '';
        player.bg.list.forEach(function(value,index){
            html += '<li data-id="' + index + '"><a><img src="' + value + '"/></a></li>';
        });
        return html;
    }
    $playConfig.find(".playConfig_" + player.config.playType).addClass('current');
    $body.css('background-image','url(' + player.bg.list[player.bg.id] + ')');
    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    getSongList()
        .done(function(data){
            player.songList = data.list;
        })
        .then(pushSongList)
	$window.on("resize",resize);
    $songList.on("click","li",function(){
        var $t = $(this),
            id = $t.data("id");
        stopOrPlay(true);
        $t.addClass('current').siblings().removeClass('current');
        playAction(id);
    });
    $lrcUl.on("click","li",function(){
        var $t = $(this),
            time = $t.data("time");
        if ( player.audio.paused || time === undefined ){
            return false;
        }
        if ( player.audio.stop ){
            playAction(player.currentID);
        }
        player.audio.currentTime = time/1000;
    });
    $playConfig.on("click","a",function(){
        var $t = $(this),
            type = $t.data("type");
        localStorage.setItem("playType",player.config.playType = type);
        $t.addClass('current').siblings().removeClass('current');
    });
    $(document).on("keydown",function(e){
        switch (e.which){
            case 13:
                player.audio.currentTime = 0;
                e.preventDefault();
            break;
            case 32:
                stopOrPlay();
                e.preventDefault();
            break;
            case 37:
                songPrev();
                e.preventDefault();
            break;
            case 39:
                songNext();
                e.preventDefault();
            break;
            case 38:
                var curVolume = player.audio.volume + 0.1;
                if ( curVolume > 1 ){
                    curVolume = 1;
                }
                player.audio.volume = curVolume;
                e.preventDefault();
            break;
            case 40:
                var curVolume = player.audio.volume - 0.1;
                if ( curVolume < 0 ){
                    curVolume = 0;
                }
                player.audio.volume = curVolume;
                e.preventDefault();
            break;
        }
    }).on("click",function(){
        $bgConfig.removeClass('current');
    });
    $bgConfig.on("click",function(e){
        e.stopPropagation();
    });
    $songCoverA.on("click",stopOrPlay);
    $songPlay.on("click",stopOrPlay);
    $songProgress.on("click",clickProgress);
    $songPrev.on("click",songPrev);
    $songNext.on("click",songNext);
    $bgChangeBtn.on("click",bgListShow);
    if ( typeof define === "function" && define.amd ) {
        define("player", [], function() {
            return player;
        });
    }
});