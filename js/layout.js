// 生成css的代码
var calc = function(start, end){
    var _X = 3;
    var _Y = 3;
    var _start = {
        x: Math.min( start/_X, end/_X ) | 0,
        y: Math.min( start%_Y, end%_Y )
    }, _end = {
        x: Math.max( start/_X, end/_X ) | 0,
        y: Math.max( start%_Y, end%_Y )
    };

    var res = [];
    for(var i=_start.x; i <= _end.x; i++){
        for(var j=_start.y; j <= _end.y; j++){
            res.push( i*_X + j );
        }
    }
    // return {
    //     className: "layout-" + res.join("-"),
    //     left: _start.x,
    //     top: _start.y,
    //     width: _end.x - _start.x,
    //     height: _end.y - _start.y 
    // };
    return {
        className: '.layout-'+res.join("-"),
        style: '.layout-'+res.join("-")
            +'{height:'+((1 + _end.x - _start.x)/_X*100+"").replace(/(\.\d{4})\d*$/,"$1")+'%;'
            +'width:'+((1 + _end.y - _start.y)/_Y*100+"").replace(/(\.\d{4})\d*$/,"$1")+'%;'
            +'top:'+(_start.x/_X*100+"").replace(/(\.\d{4})\d*$/,"$1")+'%;'
            +'left:'+(_start.y/_Y*100+"").replace(/(\.\d{4})\d*$/,"$1")+'%;}'
    };
};

var all = {}, styles = "";
for(var i=0; i<9; i++){
    for(var j=i; j<9; j++){
        var m = calc(i,j);
        all[m.className] = m;
    }
}
for(var k in all){
    styles += all[k].style + "\n";
}

require("fs").writeFile("../css/layout.less", styles, function(e){
    console.log( "../css/layout.less output OK!" );
});
