;(function(S){


    // 定时器封装
    S.add("ppt/r", function(S){
        var Raf = function(fn){return setTimeout(fn, 1000/60)};

        Raf = navigator.userAgent.match(/mobile/i) ? Raf: 
            (window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || Raf);

        var _timeoutQueue = {}, index = 0;
        function queueTimeout(){
            for(var i in _timeoutQueue){
                var fn = _timeoutQueue[i];
                if( index % fn.timer === 0 ){   //如果按照时间轮训到了，执行代码
                    if( !fn.times-- ){          //如果可执行次数为0, 移除方法
                        delete _timeoutQueue[i];
                    }else{
                        var _r = fn();  
                        if(_r === false){
                            delete _timeoutQueue[i];
                        }
                    }
                }
            }
            Raf(queueTimeout);
            index = ( index + 1) % (18000) ; //最高时隔5分钟
        }
        queueTimeout(); 
        return {
            /**
             * 按照指定key添加轮训事件 【首次添加一般不会立即执行】
             * k    : 轮询事件的key
             * fn   : 要轮训的事件    return false; 
             * timer: 轮训间隔,单位ms, 默认是200, 只支持 1000/60 的倍数
             * times: 轮询事件执行次数, 达到指定次数后清除
            **/
            addTimeout: function(k,fn,timer,times){
                fn.timer = Math.floor( (timer||200) * 60 / 1000);
                fn.times = times || Infinity;
                _timeoutQueue[k] = fn;
            }
        };
    });

    S.add("ppt/easing", ["node"], function(S, require, exports, module){
        var $ = require("node"),
            W = $(document.body).width();

        return navigator.userAgent.match(/MSIE [5-9]/i) ? {
            ease: function(_x){
                this.animate({
                    left: _x * W
                },.3);
            }
        }:{
            ease: function(_x){
                this.css({
                    transform: "translate3d(" + (_x * W) + "px, 0, 0)"
                });
            }
        };
    });

    S.add("ppt/tab", ["node","ppt/r","ppt/easing"], function(S, require, exports, module){
        var 
            R = require("ppt/r"),
            EAS = require("ppt/easing"),
            $ = require("node").all,

            index = -1,
            tar_index = 0,
            container = {},
            sections = {}, 
            easing = {},
            defaults = {
                index: 0,
                type: "ease",
                auto: false
            };

        var Tab = function(con, conf){
            S.mix(defaults, conf);
            container = $(con);
            this.sections = sections = container.children();
            tar_index = defaults.index | 0;
            easing = EAS[defaults.type] || EAS.ease;
            container.addClass("easing-"+defaults.type);

        };

        S.augment(Tab,{
            to: function(i){
                tar_index = i;
            }
        });

        $(document).on("keyup", function(e){
            if( !defaults.auto ){
                switch(e.keyCode){
                    case 32:  break;
                    case 39:
                    case 40: tar_index = index + 1; break;
                    case 37:
                    case 38: tar_index = index - 1; break; 
                }
            }
        });

        // 监听自动播放
        R.addTimeout("ppt/auto", function(){

        });


        // 监听运行
        R.addTimeout("ppt/tab", function(){
            if( sections.each && index != tar_index ){
                index = tar_index = Math.min( Math.max( 0, tar_index ), sections.length - 1);;
                sections.each(function(dom, i){
                    this.removeClass("current");
                    this.removeClass("next");
                    this.removeClass("prev");
                    var flag = "";
                    switch(i){
                        case index: flag = "current";break;
                        case index - 1: flag = "prev";break;
                        case index + 1: flag = "next";break;
                        default: 
                    }
                    this.addClass( flag );
                    easing && easing.call(this, i-index);
                });
            }
        });
        return Tab;
    });


    S.add("ppt/index", ["ppt/tab"],function(S, require, exports, module){
        var Tab = require("ppt/tab");
        var tab = new Tab("#container");


    });
})(KISSY);

