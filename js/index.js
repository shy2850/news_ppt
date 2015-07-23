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

    S.add("ppt/tab", ["node","ppt/r","ppt/effect","ppt/tip"], function(S, require, exports, module){
        var 
            R = require("ppt/r"),
            EAS = require("ppt/effect"),
            $ = require("node").all,

            viewer = $(".preview-container .view-inner"),
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

        var tip = require("ppt/tip"),
            firstTip;

        var Tab = function(con, conf){
            S.mix(defaults, conf);
            container = $(con);
            sections = container.children();
            tar_index = defaults.index | 0;
            effect = EAS[defaults.effect] || EAS.ease;

            viewer.html("");
            sections.each(function(el,i){
                var src = ( this.children().attr("src") );
                viewer.append( '<li data-index="'+i+'"><img src="'+src+'" alt=""/></li>' );
            });
            viewer.css({
                width: 288 * sections.length
            });
        };

        var step = $(".step-container"), onpreview;
        $(document).on("keydown", function(e){
            switch(e.keyCode){
                case 13:
                    onpreview = !onpreview;
                    break;
                case 32:
                    onpreview = false;
                    defaults.auto = !defaults.auto; 
                    tip( defaults.auto ? "开始自动播放" : "取消自动播放");
                    break;
                case 39:
                case 40: tar_index = index + 1; break;
                case 37:
                case 38: tar_index = index - 1; break; 
            }
        }).on("doubleTap", function(e){
            defaults.auto = !defaults.auto;
            tip( defaults.auto ? "开始自动播放" : "取消自动播放", 3 );
        }).on("swipe", function(e){
            switch(e.direction){
                case "left":
                    tar_index = index + 1; break;
                case "right":
                    tar_index = index - 1; break;
                default:
                    defaults.auto = !defaults.auto;
                    tip( defaults.auto ? "开始自动播放" : "取消自动播放", 3 );
            }
        }).delegate("click",".ppt-prev",function(){
            if(!firstTip){
                firstTip = true;
                tip("使用方向键前进后退, 空格切换自动播放", 5);
            }
            tar_index = index - 1;
        }).delegate("click",".ppt-next",function(){
            tar_index = index + 1;
        }).delegate("click",".preview",function(){
            tip("使用Enter键打开关闭 预览模式");
            onpreview = !onpreview;
        }).on("mousemove", function(e){
            if( onpreview ){return;}
            if( document.body.clientWidth <= 640 ){return;}
            var per = ( e.pageX / document.body.clientWidth );
            if( per < .25 || per > .75 ){
                step.show();
            }else{
                step.hide();
            }
        });
        viewer.delegate("click","li",function(e){
            var index = $(e.currentTarget);
            tar_index = index.attr("data-index") | 0;
            onpreview = false;
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
        var body = $("body");
        R.addTimeout("ppt/tab", function(){
            if( onpreview ){
                body.addClass("onpreview");
            }else{
                body.removeClass("onpreview");
            }
            if( sections.each && index != tar_index ){
                tar_index = Math.max( 0, tar_index ) % sections.length;
                var dir = tar_index - index;
                if(!dir){
                    return;
                }else{
                    index = tar_index;
                } 
                viewer.children().item(index).addClass("current").siblings().removeClass("current");
                viewer.parent().scrollLeft(index * 288);   
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
    
    S.add("ppt/tip", ["node"], function(S, require){
        var $ = require("node").all,
            color = "#1a96cc",
            holder;
        return function(info,t){
            if(!holder){
                var hl = document.createElement("div");
                hl.innerHTML = '<p style="position:absolute;width: 100%; left: 0;top: 0;z-index:3001;text-align: center;"><span style="color:#fff;display:inline-block;padding:.5em 1em;background-color:#1a96cc;font: bold 20px/1 \'Microsoft Yahei\';">'+info+'</span></p>'
                holder = $(hl.children[0]);
                $("body").append(hl.children[0]);
            }
            holder.children().html(info);
            holder.fadeIn(t||1).fadeOut(t||1);
        };

    });
    S.add("ppt/compile",[],function(S){
        var template = '<section data-effect="{{effect}}" class="effect-{{effect}}">'
            +'<img src="{{typeData}}" class="bg-ppt"/>'
            +'<div class="layout layout-{{layout}}">'
                +'<div class="opacity" style="background-color:{{bgColor}};"></div>'
                +'<div class="layout-inner">'
                    +'<h2>{{title}}</h2>'
                    +'<div class="desc">{{desc}}</div>'
                    +'<div class="start">{{startBtn}}</div>'
                +'</div>'
            +'</div>'
            +'</section>';
        return function(data){
            data.typeData = data.typeData || data.pic;
            data.layout = data.layout || "3-4-5";
            data.bgColor = data.fontbg ? data.bgColor : "none";
            data.desc = '<p>'+(data.desc||"").replace(/\/n/g,'</p><p>')+'</p>'
            data.startBtn = data.start ? ('<a href="javascript:void(0);" class="ppt-next">'+data.start+'</a>') : '';
            return template.replace(/\{\{(\w+)\}\}/g,function(mat,k){
                return data[k] || "";
            });
        };
    });

    S.add("ppt/index", ["node","ppt/compile","ppt/tab"],function(S, require, exports, module){
        var $ = require("node").all,
            compile = require("ppt/compile"),
            Tab = require("ppt/tab");

        return function(data){
            var container = $("#container"), innerHTML = "";
            innerHTML += compile(data.cover);
            S.each(data.content, function(page){
                innerHTML += compile(page);            
            });
            container.html( innerHTML );

            var tab = new Tab(container,{
                effect: data.cover.effect || "ease",
                auto: data.autoRun || false
            });

            tab.setAuto( data.autoTime || 4000 );

            return tab;
        };

    });
})(KISSY);

