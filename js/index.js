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

    S.add("ppt/tab", ["node","ppt/r","ppt/effect"], function(S, require, exports, module){
        var 
            R = require("ppt/r"),
            EAS = require("ppt/effect"),
            $ = require("node").all,

            index = -1,
            tar_index = 0,
            container = {},
            sections = {}, 
            effect = function(){},
            defaults = {
                index: 0,
                effect: "ease",
                auto: false,
                autoTime: 5000
            };

        var Tab = function(con, conf){
            S.mix(defaults, conf);
            container = $(con);
            this.sections = sections = container.children();
            tar_index = defaults.index | 0;
            effect = EAS[defaults.effect] || EAS.ease;


        };
        $(document).on("keydown", function(e){
            switch(e.keyCode){
                case 32: defaults.auto = !defaults.auto; if(defaults.auto){return;}else{break;}
                case 39:
                case 40: tar_index = index + 1; break;
                case 37:
                case 38: tar_index = index - 1; break; 
            }
        }).on("swipe", function(e){
            switch(e.direction){
                case "left":
                    tar_index = index + 1; break;
                case "right":
                    tar_index = index - 1; break;
            }
        }).delegate("click",".ppt-prev",function(){
            tar_index = index - 1;
        }).delegate("click",".ppt-next",function(){
            tar_index = index + 1;
        }).on("mousemove", function(e){
            var per = (e.pageX / document.body.clientWidth) || 0;
            if( per < .2 || per > .8 ){
                $(".step-container").show()
            }else{
                $(".step-container").hide();
            }
        });

        S.augment(Tab,{
            to: function(i){
                tar_index = i;
            },
            setAuto: function(auto){
                if(auto){
                    // 监听自动播放
                    R.addTimeout("ppt/auto", function(){
                        if(defaults.auto){
                            tar_index = index + 1;
                        }
                    },auto);
                }else{
                    defaults.auto = false;
                }
                return this;
            }
        });


        // 监听运行
        R.addTimeout("ppt/tab", function(){
            if( sections.each && index != tar_index ){
                tar_index = Math.max( 0, tar_index ) % sections.length;
                var dir = tar_index - index;
                if(!dir){
                    return;
                }else{
                    index = tar_index;
                }    
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

                    (EAS[this.attr("data-effect")] || effect).call(this, i-index, dir);
                });
            }
        });
        return Tab;
    });


    S.add("ppt/compile",[],function(S){
        var template = '<section data-effect="{{effect}}" class="effect-{{effect}}">'
            +'<img src="{{typeData}}" class="bg-ppt"/>'
            +'<div class="layout layout-{{layout}}">'
                +'<div class="opacity" style="background-color:{{bgColor}};"></div>'
                +'<div class="layout-inner">'
                    +'<h2>{{title}}</h2>'
                    +'<div class="desc">{{desc}}</div>'
                    +'<div class="start">{{start}}</div>'
                +'</div>'
            +'</div>'
            +'</section>';
        return function(data){
            data.typeData = data.typeData || data.pic;
            data.layout = data.layout || "3-4-5";
            data.desc = '<p>'+(data.desc||"").replace(/\/n/g,'</p><p>')+'</p>'
            data.start = data.start ? ('<a href="javascript:void(0);" class="ppt-next">'+data.start+'</a>') : '';
            return template.replace(/\{\{(\w+)\}\}/g,function(mat,k){
                return data[k] || "";
            });
        };
    });

    S.add("ppt/index", ["node","ppt/compile","ppt/tab"],function(S, require, exports, module){
        var $ = require("node").all,
            compile = require("ppt/compile"),
            Tab = require("ppt/tab");

        var container = $("#container"), innerHTML = "";
        innerHTML += compile(data.cover);
        S.each(data.content, function(page){
            innerHTML += compile(page);            
        });
        container.html( innerHTML );

        var tab = new Tab(container,{
            effect: "rotate"
        });

        tab.setAuto(2000).setAuto(false);

    });
})(KISSY);

