var $ = function(q) {
	return document.querySelectorAll(q)
};

/*--------------------------------------------------------------------
 * 点
 */
var P = (function() {

	function P(x, y) {
		if (!(this instanceof P)) {
			return new P(x, y);
		}
		this.x = x;
		this.y = y;
	}

	return P;
}());

/*--------------------------------------------------------------------
 * 行列
 */
var V = (function() {
	function V() {
		var instance = this;
		if (!(this instanceof V)) instance = new V();

		instance.vals = [];
		Array.prototype.push.apply(instance.vals, arguments);

		return instance
	}

	V.prototype.dot = function(v2) {
		var res = 0;
		for (var i = 0, max = this.vals.length; i < max; i++) {
			res += this.vals[i] * v2.vals[i];
		}
		return res;
	}

	V.prototype.add = function(v2) {
		var v = new V();
		for (var i = 0, max = this.vals.length; i < max; i++) {
			v.vals.push(this.vals[i] + v2.vals[i]);
		}

		return v;
	}

	V.prototype.min = function(v2) {
		var v = new V();
		for (var i = 0, max = this.vals.length; i < max; i++) {
			v.vals.push(this.vals[i] - v2.vals[i]);
		}
		return v;
	}

	V.prototype.multi = function(c) {
		var v = new V();
		for (var i = 0, max = this.vals.length; i < max; i++) {
			v.vals.push(this.vals[i] * c);
		}
		return v;
	}

	return V
}());

function init() {
	var btnFlag = true;

	canvas
		.init()
		.size(-10, -10, 10, 10)
		.mathGrid();

	var statusX = $("#statusX")[0],
		statusY = $("#statusY")[0],
		btnChange = $("#btnChange")[0],
		btnClear = $("#btnClear")[0],
		canvasWrapper = $("#canvasWrapper")[0],
		samples = [];

	canvasWrapper.addEventListener("click", function(ev) {
		var canvasX = canvas.translateX2(ev.offsetX),
			canvasY = canvas.translateY2(ev.offsetY);

		perceptron.addSample(canvasX, canvasY, btnFlag ? 1 : -1);
	});

	btnChange.addEventListener("click", function(ev) {
		btnFlag = !btnFlag;
		btnChange.className = btnFlag ? "typeBlack" : "typeBlue";
		btnChange.value = btnFlag ? "点：黒" : "点：青";
	});

	btnClear.addEventListener("click", function(ev) {
		perceptron.clearSample();
	});

	perceptron.start();
}

var perceptron = (function() {
	var perceptron = {},
		samples = [],
		timerID,
		w = V(0, 0, 0),
		c = 0.1; //学習率

	perceptron.show = function() {
		console.group("W");
		console.log(w.vals);
		console.groupEnd();

		for (var i = 0, max = samples.length; i < max; i++) {
			console.group(i)
			console.log(samples[i].pos.vals);
			console.log(samples[i].label);
			console.log(w.dot(samples[i].pos));
			console.groupEnd();
		}
	};

	function update() {
		canvas
			.clear()
			.mathGrid();

		for (var j = 0, max = samples.length; j < max; j++) {
			if (samples[j].label == 1) {
				canvas.fillColor(0, 0, 0);
			} else {
				canvas.fillColor(0, 0, 255);
			}

			canvas
				.start()
				.plot(samples[j].pos.vals[1], samples[j].pos.vals[2])
				.fill();
		}
	}

	function train() {
		//学習
		for (var i = 0, max = samples.length; i < max; i++) {

			var sample = samples[i],
				result = w.dot(sample.pos),
				judge = result >= 0 ? 1 : -1;

			if (judge != sample.label) {
				if (sample.label > 0) {
					w = w.add(sample.pos.multi(c));
				} else {
					w = w.min(sample.pos.multi(c));
				}
			}
		}

		var w1 = w.vals[0],
			w2 = w.vals[1],
			w3 = w.vals[2];

		var x0 = canvas.x0(),
			y0 = -1.0 * w2 / w3 * x0 - 1.0 * w1 / w3,
			x1 = canvas.x1(),
			y1 = -1.0 * w2 / w3 * x1 - 1.0 * w1 / w3;

		update();
		canvas
			.start()
			.strokeColor(0, 128, 0)
			.line(x0, y0, x1, y1)
			.stroke();

		timerID = setTimeout(function() {
			train();
		}, 40);
	}

	perceptron.addSample = function(x, y, label) {
		samples.push({
			label: label,
			pos: V(1, x, y)
		});
		update();
	};

	perceptron.clearSample = function(x, y, label) {
		samples = [];
		update();
	};

	perceptron.start = function() {
		train(0);
	};

	perceptron.stop = function() {
		clearTimeout(timerID);
	}

	return perceptron
}());

var canvas = (function() {
	var canvas = {},
		x0, y0, x1, y1,
		dom, ctx;

	/*--------------------------------------------------------------------
	 * プロパティ群
	 */

	canvas.size = function(_x0, _y0, _x1, _y1) {
		canvas
			.x0(_x0)
			.y0(_y0)
			.x1(_x1)
			.y1(_y1);
		return this
	}
	canvas.x0 = function(x) {
		if (x === undefined) return x0
		x0 = x;
		return this
	}

	canvas.y0 = function(y) {
		if (y === undefined) return y0
		y0 = y;
		return this
	}

	canvas.x1 = function(x) {
		if (x === undefined) return x1
		x1 = x;
		return this
	}

	canvas.y1 = function(y) {
		if (y === undefined) return y1
		y1 = y;
		return this
	}

	canvas.width = function(w) {
		if (w === undefined) return x1 - x0
		x1 = x0 + w;
		return this
	}

	canvas.height = function(h) {
		if (h === undefined) return y1 - y0
		y1 = y0 + h;
		return this
	}

	/*--------------------------------------------------------------------
	 * 初期化
	 */

	canvas.init = function() {
		dom = $("#canvas")[0];
		ctx = dom.getContext("2d");
		this.size(0, 0, dom.width, dom.height);

		return this
	};

	/*--------------------------------------------------------------------
	 * 座標変換
	 */

	canvas.translateX = function(x) {
		var scaleX = this.width() / dom.width;
		return (x - this.x0()) / scaleX
	}

	canvas.translateY = function(y) {
		var scaleY = this.height() / dom.height;
		return dom.height - (y - this.y0()) / scaleY
	}

	canvas.translateP = function(p) {
		return P(this.tlanslateX(x), this.tlanslateY(y));
	};

	canvas.translateX2 = function(x) {
		var scaleX = this.width() / dom.width;
		return x * scaleX + this.x0()
	}

	canvas.translateY2 = function(y) {
		var scaleY = this.height() / dom.height;
		return (dom.height - y) * scaleY + this.y0()
	}

	canvas.translateP2 = function(p) {
		return P(this.tlanslateX2(x), this.tlanslateY2(y));
	};

	/*--------------------------------------------------------------------
	 * 原始的な描画メソッド群
	 */

	canvas.strokeColor = function(r, g, b) {
		ctx.strokeStyle = "rgb(" + r + "," + g + "," + b + ")";
		return this
	};

	canvas.fillColor = function(r, g, b) {
		ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
		return this
	};

	canvas.lineWidth = function(w) {
		ctx.lineWidth = w;
		return this
	};

	canvas.line = function(_x0, _y0, _x1, _y1) {
		if (_x0 instanceof P && _y0 instanceof P) {
			return canvas.line(_x0.x, _x0.y, _y0.x, _y0.y);
		}

		_x0 = this.translateX(_x0);
		_y0 = this.translateY(_y0);
		_x1 = this.translateX(_x1);
		_y1 = this.translateY(_y1);

		ctx.moveTo(_x0, _y0);
		ctx.lineTo(_x1, _y1);

		return this
	};

	canvas.plot = function(x, y, r) {
		if (x instanceof P) {
			return canvas.plot(x.x, x.y, y);
		}

		x = this.translateX(x);
		y = this.translateY(y);
		r = r || 5;

		ctx.arc(x, y, r, 0, 2 * Math.PI, false);
		ctx.closePath();

		return this
	};

	canvas.clear = function() {
		ctx.clearRect(0, 0, dom.width, dom.height);

		return this;
	};

	canvas.start = function() {
		ctx.beginPath();
		return this;
	};

	canvas.stroke = function() {
		ctx.stroke();
		return this;
	};

	canvas.fill = function() {
		ctx.fill();
		return this;
	};

	/*--------------------------------------------------------------------
	 * 数学系
	 */

	canvas.grid = function(dx, dy) {
		x0 = this.x0(),
		x1 = this.x1(),
		y0 = this.y0(),
		y1 = this.y1();

		for (var x = x0; x <= x1; x += dx) {
			this.line(x, y0, x, y1);
		}
		for (var y = y0; y <= y1; y += dy) {
			this.line(x0, y, x1, y);
		}

		ctx.stroke();

		return this
	}

	canvas.mathGrid = function() {
		this
			.start()
			.strokeColor(210, 210, 210)
			.lineWidth(0.2)
			.grid(1, 1)
			.stroke()
			.start()
			.strokeColor(0, 0, 0)
			.lineWidth(0.2)
			.grid(5, 5)
			.stroke()
			.start()
			.strokeColor(0, 0, 0)
			.lineWidth(1)
			.line(0, this.y0(), 0, this.y1())
			.line(this.x0(), 0, this.x1(), 0)
			.stroke();

		return this
	}


	return canvas;
}());

window.addEventListener("load", init);
