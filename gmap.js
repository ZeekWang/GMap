/*
 *  GMap JavaScript Library v0.1
 *	An implementation of GMap
 *  Reference: 
 *  Emden Gansner, Yifan Hu and Stephen Kobourov, GMap: drawing graphs and clusters as map, proceedings of IEEE Pacific Visualization Symposium, pp. 201 - 208, 2010.
 *  
 *	AUTHOR: Zeek Wang
 *  Date: 2013/10
 */

(function(){

	var GMap = function(config){
		init(config);
		processNodes();
		createVoronoi();
		GMap.render();
	};

	var config = {};
	var width, height, htmlElement, nodes, clusterCount, colors, svg;
	var minDistance, tolerance;
	var clusters = [], noises = [], pointsForVoronoi = [], maps = [], voronoiDiagrams = [];
	var defaultColors = ["rgba(220, 220, 0, 0.5)", "rgba(120, 20, 120, 0.5)"];

	function init(userConfig){
		if (!userConfig.width || !userConfig.height || !userConfig.nodes || !userConfig.clusterCount || !userConfig.htmlElement){
			console.log("Error! Missing Parameters in GMap.");
			return;
		}
		width = config.width = userConfig.width;
		height = config.height = userConfig.height;
		htmlElement = config.htmlElement = userConfig.htmlElement;
		nodes = config.nodes = userConfig.nodes;
		clusterCount = config.clusterCount = userConfig.clusterCount;
		config.minDistance = minDistance = 
			userConfig.minDistance ? userConfig.minDistance : (width * height) / nodes.length;
		config.tolerance = tolerance =
			userConfig.tolerance ? userConfig.tolerance : Math.round((width + height) / 100);
		if (userConfig.colors)
			colors = config.colors = userConfig.colors;
	}

	function processNodes() {
		clusters = [];
		pointsForVoronoi = [];
		var noiseCells = [];
		var cellWidth = (width / tolerance) + 1,
			cellHeight = (height / tolerance) + 1;
		for (var i = 0; i <= cellWidth; i++){
			noiseCells[i] = [];
			for (var j = 0; j < cellHeight; j++) {
				noiseCells[i][j] = {
					x: tolerance * Math.random() + i * tolerance,
					y: tolerance * Math.random() + j * tolerance,
					cluster: -1,
					available: true
				}; 
			}
		}
		for (var i = 0; i < clusterCount; i++) {
			clusters[i] = [];
		}
		var r = Math.round(minDistance / tolerance) + 1;
		for (var i = 0; i < nodes.length; i++){
			var node = nodes[i];
			var clusterId = node.cluster;
			pointsForVoronoi.push([node.x, node.y]);
			clusters[clusterId].push(i);
			var p = Math.round(node.x / tolerance),
				q = Math.round(node.y / tolerance);
			for (var x = Math.max(0, p - r); x < Math.min(p + r, cellWidth); x++)
				for (var y = Math.max(0, q -r); y < Math.min(q + r, cellHeight); y++){
					if (noiseCells[x][y].available == false)
						continue;
					var dis =  computeDistance(
						noiseCells[x][y].x, noiseCells[x][y].y, node.x, node.y
					)
					if (dis < minDistance)
						noiseCells[x][y].available = false;
				}
		}
		noises = [];
		for (var i = 0; i <= (width / tolerance) + 1; i++){
			for (var j = 0; j < (height / tolerance) + 1; j++) {
				if (noiseCells[i][j].available == true)
					pointsForVoronoi.push([noiseCells[i][j].x, noiseCells[i][j].y]);
					noises.push(pointsForVoronoi.length - 1);
			}
		}
	}

	function createColorScheme(){

	}

	function createVoronoi() {
		// voronoi = d3.geom.voronoi().clipExtent([[0, 0], [width, height]]);
		voronoi = d3.geom.voronoi();
		console.log(pointsForVoronoi);
		voronoiDiagrams = voronoi(pointsForVoronoi);
		console.log(voronoiDiagrams);
		mergePolygons();

	}

	function mergePolygons() {
		// var geomFact = new jsts.geom.GeometryFactory();
		// for (var i = 0; i < clusters.length; i++) {
		// 	var cluster = clusters[i];
		// 	var polygons = [];
		// 	for (var j = 0; j < cluster.length; j++) {
		// 		var polygon = voronoiDiagrams[cluster[j]];
		// 		var coordinates = [];
		// 		for (var k = 0; k < polygon.length; k++){
		// 			coordinates.push(new jsts.geom.Coordinate(polygon[k][0], polygon[k][1]));
		// 		}
		// 		coordinates.push(new jsts.geom.Coordinate(polygon[0][0], polygon[0][1]));
		// 		var poly = geomFact.createLinearRing(coordinates);
		// 		poly = geomFact.createPolygon(poly);

		// 		polygons.push(poly);
		// 	}
		// 	var mergedPolygon = polygons[0];
		// 	for (var j = 1; j < polygons.length; j++) {
		// 		// console.log(j);
		// 		// console.log(mergedPolygon);
		// 		mergedPolygon = mergedPolygon.union(polygons[j]);
		// 	}
		// 	console.log(mergedPolygon);
		// }
	}

	GMap.render = function() {
		var color = d3.scale.category10();
		var svg = d3.select("#" + htmlElement).append("svg")
			.attr("width", width)
			.attr("height", height)
			.attr("class", "gmap");
		console.log(voronoiDiagrams);
		for (var i = 0; i < clusters.length; i++) {
			var clusterId = i;
			var cluster = clusters[i];
			var polygons = [];
			for (var j = 0; j < cluster.length; j++){
				polygons.push(voronoiDiagrams[cluster[j]]);
			}
			console.log(polygons);
			svg.append("g")
				.selectAll("polygon")
				.data(polygons)
				.enter()
				.append("polygon")
				.attr("points", function(d){
					return d.map(function(d){
						return [d[0], d[1]].join(",");
					}).join(" ");
				})
				.attr("fill", function(d) {
					return color(clusterId);
				})
				.attr("stroke-width", 1)
				.attr("stroke", function(d){
					return color(clusterId);
				})
		}

	}

	function map(value, min, max, toMin, toMax){
		var v = (value - min) / (max - min) * (toMax - toMin) + toMin;
		return v;
	}

	function simpleMap(value, max, toMax){
		if (max < 0.00001)
			return 0;
		
		if (value < 0)
			value = 0;
		if (value > max)
			value = max;

		return v = value / max * toMax;
	}
	
	function sqrt(value){
		return Math.sqrt(value);
	}

	function computeDistance(x1, y1, x2, y2) {
		return Math.sqrt( (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1) );
	}

	window['GMap'] = GMap;
})();