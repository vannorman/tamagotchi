// console.log("MAIN2 loading");

perlin2 = []
var Ajax = {
    Get_Perlin(dim) {
        $.ajax({
            type: 'POST',
            url: "/get_perlin",
            data : JSON.stringify({ dim : parseInt(dim) }),
            headers: {
                "X-CSRFToken" : csrf,
                "Content-Type": "application/json"
            },
                success: function (e) {
                perlin2 = JSON.parse(e.noise);
                console.log("got perlin len:"+perlin2.length)
                callback(perlin2);
 
            },
            error: function (e) {
                console.log("error:"+JSON.stringify(e));
            },
        });

    },
 
}
