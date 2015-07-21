    
KISSY.add("ppt/effect", ["node"], function(S, require, exports, module){
    var $ = require("node"),
        W = $(document.body).width();

    return navigator.userAgent.match(/MSIE [5-9]/i) ? {
        ease: function(_x){
            this.animate({
                left: _x * W
            },.3);
        },
        fade: function(_x){
            this.animate({
                opacity: _x ? 0 : 1
            },.3);
        }
    }:{
        ease: function(_x){
            this.css({
                transform: "translate3d(" + (_x * W) + "px, 0, 0)"
            });
        },
        fade: function(_x){
            this.css({
                opacity: _x ? 0 : 1
            });
        },
        rotate: function(_x){
            this.css({
                transform: "rotate("+(_x?0:360)+"deg) scale("+(_x?0:1)+")"
            });
        },
        dirShow: function(_x, dir){
            var t = this;
            ["show","hide","left","right"].forEach(function(c){
                t.removeClass( c );
            });
            if( dir > 0 ){
                this.addClass( _x ? "hide right" : "show right" );
            }else{
                this.addClass( _x ? "hide left" : "show left" );
            }
        }
    };
});