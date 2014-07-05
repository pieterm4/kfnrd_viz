var width = 960,
    height = 1160;

var projection = d3.geo.mercator()
    .center([20, 52])
    .scale(3000)
    .translate([400, 350]);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);


var CZAS_PRZEJSCIA = 400;


function miejsce_id (d) {
  return d.poczta + ", woj. " + d.wojewodztwo;
}


var ludzie_do_miast = function (ludzie) {
  var dict = {};
  var d, miasto_woj;
  for (var i = 0; i < ludzie.length; i++) {
    d = ludzie[i];
    miasto_woj = miejsce_id(d);
    if (miasto_woj in dict) {
      dict[miasto_woj].osoby += 1;
    } else {
      dict[miasto_woj] = {osoby: 1, lng: +d.lng, lat: +d.lat};
    }
  }
  var res = [];
  for (var k in dict) {
    d = dict[k];
    res.push({miasto_woj: k, osoby: d.osoby, lng: d.lng, lat: d.lat})
  };
  return res.sort(function (a, b) {
    return b.osoby - a.osoby;
  });
}


var ludzie_do_miast_zliczenia = function (ludzie) {
  var dict = {};
  var d, miasto_woj;
  for (var i = 0; i < ludzie.length; i++) {
    d = ludzie[i];
    miasto_woj = miejsce_id(d);
    if (miasto_woj in dict) {
      dict[miasto_woj] += 1;
    } else {
      dict[miasto_woj] = 1;
    }
  }
  return dict;
}


var ludzie_do_dziedzin = function (ludzie) {
  var dict = {};
  var d;
  for (var i = 0; i < ludzie.length; i++) {
    d = ludzie[i];
    dziedzina = d.dziedzina;
    if (dziedzina in dict) {
      dict[dziedzina].osoby += 1;
    } else {
      dict[dziedzina] = {osoby: 1};
    }
  }
  var res = [];
  for (var k in dict) {
    d = dict[k];
    res.push({dziedzina: k, osoby: d.osoby})
  };
  return res.sort(function (a, b) {
    return b.osoby - a.osoby;
  });
}


var ludzie_do_dziedzin_zliczenia = function (ludzie) {
  var dict = {};
  var d;
  for (var i = 0; i < ludzie.length; i++) {
    d = ludzie[i];
    dziedzina = d.dziedzina;
    if (dziedzina in dict) {
      dict[dziedzina] += 1;
    } else {
      dict[dziedzina] = 1;
    }
  }
  return dict;
}


d3.json("poland_border.topo.json", function(error_poland, poland_data) {
  d3.csv("kfnrd_miejsce_dziedzina.csv", function(error_dem, people_data) {
    zacznij_wizualizajce(poland_data, people_data);
  })
});


function zacznij_wizualizajce (poland_data, people_data) {

  svg.append("path")
      .datum(topojson.feature(poland_data, poland_data.objects.poland_border))
      .attr("d", path)
      .attr("class", "polska");

  var lata = [];
  for (var rok = 1997; rok < 2014; rok++) lata.push(String(rok)); 
  lata.push("WSZYSTKIE");
  // na razie na sztywno


  var lata = svg.append("g").attr("id","lata").selectAll(".rok")
        .data(lata)

  lata.enter()
          .append("text")
            .attr("class", "rok")
            .on("mouseover", function (d) {
              lata
                .attr("y", function (c) {
                  return c == d ? 65 : 50;
                })
                .classed("selected", function (c) {
                  return c == d;
                })
              if (d === "WSZYSTKIE") 
                odswiez_rok(people_data);
              else
                odswiez_rok(people_data.filter(function (c) { return c.rok === d; }));
            })
            .attr("x", function (d, i) { return 30 + 45 * i; })
            .attr("y", function (d) {
              return d === "2004" ? 65 : 50;
            })
            .text(function (d) { return d; });

  odswiez_rok(people_data.filter(function (d) { return d.rok === "2004"; }));

}

function odswiez_rok (people_data_rok) {

  var miasta = svg.selectAll('.city')
    .data(ludzie_do_miast(people_data_rok), function(d) {return d.miasto_woj; });

  miasta.enter()
    .append("circle")
      .attr("class", "city")
      .attr("cx", function (d) { return projection([d.lng, d.lat])[0]; })
      .attr("cy", function (d) { return projection([d.lng, d.lat])[1]; })
      .attr("r", 0)
      .append("title");

  miasta
      .on("mouseover", function (d) { wyswietl_dziedziny_w_miescie(dziedziny, people_data_rok, d); })
      .on("mouseout", function (d) { wyswietl_dziedziny_wszystkie(dziedziny); });
      
  miasta.select("title")
    .text(function (d) { return [d.osoby, "w", d.miasto_woj].join(" "); });

  miasta.exit()
    .transition().duration(CZAS_PRZEJSCIA)
      .attr("r", 0)
      .remove();

  wyswietl_miasta_wszystkie(miasta);

  var dziedziny = svg.selectAll('.dziedzina')
    .data(ludzie_do_dziedzin(people_data_rok), function (d) { return d.dziedzina; });

  var dziedziny_g = dziedziny.enter()
    .append("g")
      .attr("class", "dziedzina")
      .attr("transform", function (d, i) {
        return "translate(700," + (170 + 20 * i) + ")";
       });

  dziedziny_g.append("text")
    .attr("class", "dziedzina_tekst")
    .attr("x", 15);


  dziedziny_g.append("text")
    .attr("class", "dziedzina_licznik")
    .attr("text-anchor", "end");

  dziedziny
      .on("mouseover", function (d) { wyswietl_miasta_w_dziedzinie(miasta, people_data_rok, d); })
      .on("mouseout", function (d) { wyswietl_miasta_wszystkie(miasta); });

  dziedziny.exit()
    .remove();

  wyswietl_dziedziny_wszystkie(dziedziny);

  dziedziny.transition().duration(CZAS_PRZEJSCIA)
    .attr("transform", function (d, i) {
      return "translate(700," + (170 + 20 * i) + ")";
    });

}


function wyswietl_dziedziny_wszystkie (dziedziny) {

  dziedziny.select(".dziedzina_tekst") //.transition().duration(CZAS_PRZEJSCIA)
    .style("opacity", 1)
    .text(function (d) { return d.dziedzina; });

  dziedziny.select(".dziedzina_licznik") //.transition().duration(CZAS_PRZEJSCIA)
    .style("opacity", 1)
    .text(function (d) { return d.osoby; });

}


function wyswietl_dziedziny_w_miescie (dziedziny, people_data_rok, d) {

  var czesc_ludzi = people_data_rok.filter(function (c) { return miejsce_id(c) == d.miasto_woj; });

  var dziedziny_w_miescie = ludzie_do_dziedzin_zliczenia(czesc_ludzi);

  dziedziny.select(".dziedzina_tekst") //.transition().duration(CZAS_PRZEJSCIA)
    .style("opacity", function (d) {
      return dziedziny_w_miescie[d.dziedzina] ? 1 : 0.4;
    });

  dziedziny.select(".dziedzina_licznik") //.transition().duration(CZAS_PRZEJSCIA)
    .style("opacity", function (d) {
      return dziedziny_w_miescie[d.dziedzina] ? 1 : 0.4;
    })
    .text(function (d) {
      return dziedziny_w_miescie[d.dziedzina] || "";
    });

}


function wyswietl_miasta_wszystkie (miasta) {

  miasta.transition()
    .duration(CZAS_PRZEJSCIA)
      .style("opacity", 0.5)
      .attr("r", function (d) { return 3 * Math.sqrt(d.osoby); });

}


function wyswietl_miasta_w_dziedzinie (miasta, people_data_rok, d) {

  var czesc_ludzi = people_data_rok.filter(function (c) { return c.dziedzina == d.dziedzina; });

  var miasta_w_dziedzinie = ludzie_do_miast_zliczenia(czesc_ludzi);

  miasta.transition()
    .duration(CZAS_PRZEJSCIA)
      .style("opacity", 1)
      .attr("r", function (d) { return 3 * Math.sqrt(miasta_w_dziedzinie[d.miasto_woj] || 0); });

}