'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TOOL = {
  FREE: 0,
  LINE: 1,
  RECTANGLE: 2,
  TRIANGLE: 3,
  DIAMOND: 4,
  CIRCLE: 5
};

var Sketchpad = function () {
  function Sketchpad(el, opts) {
    var _this = this;

    _classCallCheck(this, Sketchpad);

    this.el = el;
    this.opts = Object.assign({}, {
      width: el.clientWidth,
      height: el.clientWidth,
      autoResize: true,
      onDraw: null
    }, opts);

    this.sketching = false;
    this.lineColor = '#000000';
    this.tool = TOOL.FREE;

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('unselectable', 'on');
    el.appendChild(this.canvas);

    this.context = this.canvas.getContext('2d');

    this.strokes = [];
    this.undos = [];

    this._aspectRatio = this.opts.width / this.opts.height;
    this.resize(this.opts.width);

    // Mouse Event Listeners
    this.canvas.addEventListener('mousedown', function (e) {
      return _this._startLine(e);
    });
    this.canvas.addEventListener('mouseenter', function (e) {
      return _this._drawLine(e);
    });
    this.canvas.addEventListener('mousemove', function (e) {
      return _this._drawLine(e);
    });
    this.canvas.addEventListener('mouseup', function (e) {
      return _this._drawLine(e);
    });
    this.canvas.addEventListener('mouseleave', function (e) {
      return _this._drawLine(e);
    });

    // if (document.body) {
    //   let body = document.body;
    //   body.addEventListener('mouseup', (e: MouseEvent) => this._endLine(e));
    //   body.addEventListener('touchend', (e: TouchEvent) => this._endLine(e));
    // }

    // Touch Event Listeners
    this.canvas.addEventListener('touchstart', function (e) {
      return _this._startLine(e);
    });
    this.canvas.addEventListener('touchmove', function (e) {
      return _this._drawLine(e);
    });

    if (this.opts.autoResize) {
      window.addEventListener('resize', function (e) {
        return _this.resize(_this.el.clientWidth);
      });
    }
  }

  _createClass(Sketchpad, [{
    key: '_getCursorRelativeToCanvas',
    value: function _getCursorRelativeToCanvas(e) {
      var point = { x: 1, y: 2 };
      if ('ontouchstart' in window && e instanceof TouchEvent) {
        e = e;
        return {
          x: (e.touches[0].pageX - this.canvas.offsetLeft) / this.canvas.width,
          y: (e.touches[0].pageY - this.canvas.offsetTop) / this.canvas.height
        };
      } else {
        e = e;
        var rect = this.canvas.getBoundingClientRect();
        return {
          x: (e.clientX - rect.left) / this.canvas.width,
          y: (e.clientY - rect.top) / this.canvas.height
        };
      }
    }
  }, {
    key: '_normalizePoint',
    value: function _normalizePoint(point) {
      return {
        x: point.x * this.canvas.width,
        y: point.y * this.canvas.height
      };
    }
  }, {
    key: '_startLine',
    value: function _startLine(e) {
      var _this2 = this;

      e.preventDefault();
      if (e.type == 'mouseenter' && !this.sketching) return;

      var body = document.body;
      if (body) {
        body.addEventListener('mouseup', function (e) {
          return _this2._endLine(e);
        });
        body.addEventListener('touchend', function (e) {
          return _this2._endLine(e);
        });
      }

      this.sketching = true;

      var point = this._getCursorRelativeToCanvas(e);
      var stroke = {
        segments: [{ points: [point] }],
        color: this.lineColor,
        size: 5,
        cap: 'round',
        join: 'round',
        miterLimit: 10
      };

      this.strokes.push(stroke);
    }
  }, {
    key: '_drawLine',
    value: function _drawLine(e) {
      e.preventDefault();
      if (!this.sketching) return;

      var point = this._getCursorRelativeToCanvas(e);

      var stroke = this.strokes[this.strokes.length - 1];
      if (e.type == 'mouseenter') {
        stroke.segments.push({ points: [] });
      }

      var segment = stroke.segments[stroke.segments.length - 1];
      var firstPoint = segment.points[0];

      if (this.tool == TOOL.FREE) {
        segment.points.push(point);
      } else if (this.tool == TOOL.LINE) {
        segment.points = [firstPoint, point];
      } else if (this.tool == TOOL.RECTANGLE) {
        segment.points = [firstPoint, { x: point.x, y: firstPoint.y }, point, { x: firstPoint.x, y: point.y }, firstPoint];
      } else if (this.tool == TOOL.TRIANGLE) {
        segment.points = [firstPoint, { x: (point.x + firstPoint.x) / 2, y: point.y }, { x: point.x, y: firstPoint.y }, firstPoint];
      } else if (this.tool == TOOL.DIAMOND) {
        segment.points = [firstPoint, { x: (point.x + firstPoint.x) / 2, y: point.y }, { x: point.x, y: firstPoint.y }, { x: (point.x + firstPoint.x) / 2, y: 2 * firstPoint.y - point.y }, firstPoint];
      } else if (this.tool == TOOL.CIRCLE) {
        segment.points = [firstPoint, point];
        segment.circle = true;
      }

      stroke.segments[stroke.segments.length - 1] = segment;
      this.redraw();
      if (this.opts.onDraw) {
        this.opts.onDraw(this.strokes);
      }
    }
  }, {
    key: '_endLine',
    value: function _endLine(e) {
      e.preventDefault();
      this.sketching = false;
    }
  }, {
    key: '_drawStroke',
    value: function _drawStroke(stroke) {
      this.context.beginPath();

      for (var i = 0; i < stroke.segments.length; i++) {
        var segment = stroke.segments[i];
        for (var j = 0; j < segment.points.length - 1; j++) {
          var start = this._normalizePoint(segment.points[j]);
          var end = this._normalizePoint(segment.points[j + 1]);

          if (segment.circle) {
            var a = start.x - end.x;
            var b = start.y - end.y;
            var radius = Math.sqrt(a * a + b * b);
            this.context.arc(start.x, start.y, radius, 0, 2 * Math.PI);
          } else {
            this.context.moveTo(start.x, start.y);
            this.context.lineTo(end.x, end.y);
          }
        }
      }

      this.context.strokeStyle = stroke.color;
      this.context.lineWidth = stroke.size;
      this.context.lineJoin = stroke.join;
      this.context.lineCap = stroke.cap;
      this.context.miterLimit = stroke.miterLimit;
      this.context.stroke();
    }

    /**
    * Set the tool to use to draw
    */

  }, {
    key: 'setTool',
    value: function setTool(tool) {
      this.tool = tool;
    }

    /**
    * Set the color of the strokes
    */

  }, {
    key: 'setLineColor',
    value: function setLineColor(color) {
      this.lineColor = color;
    }

    /**
    * Resize the canvas
    * Maintains existing aspect ratio to calculate height
    */

  }, {
    key: 'resize',
    value: function resize(width) {
      this.canvas.setAttribute('width', width.toString());
      var height = width * this._aspectRatio;
      this.canvas.setAttribute('height', height.toString());
      this.redraw();
    }

    /**
    * Undo the last stroke
    */

  }, {
    key: 'undo',
    value: function undo() {
      var stroke = this.strokes.pop();
      if (stroke) {
        this.undos.push(stroke);
        this.redraw();
      }
    }

    /**
    * Redo the last undo
    */

  }, {
    key: 'redo',
    value: function redo() {
      var stroke = this.undos.pop();
      if (stroke) {
        this.strokes.push(stroke);
        this.redraw();
      }
    }

    /**
    * Clear the canvas
    */

  }, {
    key: 'clear',
    value: function clear() {
      this.strokes = [];
      this.undos = [];
      this.redraw();
    }

    /**
    * Redraw the canvas
    */

  }, {
    key: 'redraw',
    value: function redraw() {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (var i = 0; i < this.strokes.length; i++) {
        this._drawStroke(this.strokes[i]);
      }
    }
  }]);

  return Sketchpad;
}();

var Shape = function Shape() {
  _classCallCheck(this, Shape);
};

var Line = function (_Shape) {
  _inherits(Line, _Shape);

  function Line() {
    _classCallCheck(this, Line);

    return _possibleConstructorReturn(this, (Line.__proto__ || Object.getPrototypeOf(Line)).apply(this, arguments));
  }

  return Line;
}(Shape);

var Rectangle = function (_Shape2) {
  _inherits(Rectangle, _Shape2);

  function Rectangle() {
    _classCallCheck(this, Rectangle);

    return _possibleConstructorReturn(this, (Rectangle.__proto__ || Object.getPrototypeOf(Rectangle)).apply(this, arguments));
  }

  return Rectangle;
}(Shape);

cla;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9yZXNwb25zaXZlLXNrZXRjaHBhZC5qcyJdLCJuYW1lcyI6WyJUT09MIiwiRlJFRSIsIkxJTkUiLCJSRUNUQU5HTEUiLCJUUklBTkdMRSIsIkRJQU1PTkQiLCJDSVJDTEUiLCJTa2V0Y2hwYWQiLCJlbCIsIm9wdHMiLCJPYmplY3QiLCJhc3NpZ24iLCJ3aWR0aCIsImNsaWVudFdpZHRoIiwiaGVpZ2h0IiwiYXV0b1Jlc2l6ZSIsIm9uRHJhdyIsInNrZXRjaGluZyIsImxpbmVDb2xvciIsInRvb2wiLCJjYW52YXMiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJzZXRBdHRyaWJ1dGUiLCJhcHBlbmRDaGlsZCIsImNvbnRleHQiLCJnZXRDb250ZXh0Iiwic3Ryb2tlcyIsInVuZG9zIiwiX2FzcGVjdFJhdGlvIiwicmVzaXplIiwiYWRkRXZlbnRMaXN0ZW5lciIsImUiLCJfc3RhcnRMaW5lIiwiX2RyYXdMaW5lIiwid2luZG93IiwicG9pbnQiLCJ4IiwieSIsIlRvdWNoRXZlbnQiLCJ0b3VjaGVzIiwicGFnZVgiLCJvZmZzZXRMZWZ0IiwicGFnZVkiLCJvZmZzZXRUb3AiLCJyZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwiY2xpZW50WCIsImxlZnQiLCJjbGllbnRZIiwidG9wIiwicHJldmVudERlZmF1bHQiLCJ0eXBlIiwiYm9keSIsIl9lbmRMaW5lIiwiX2dldEN1cnNvclJlbGF0aXZlVG9DYW52YXMiLCJzdHJva2UiLCJzZWdtZW50cyIsInBvaW50cyIsImNvbG9yIiwic2l6ZSIsImNhcCIsImpvaW4iLCJtaXRlckxpbWl0IiwicHVzaCIsImxlbmd0aCIsInNlZ21lbnQiLCJmaXJzdFBvaW50IiwiY2lyY2xlIiwicmVkcmF3IiwiYmVnaW5QYXRoIiwiaSIsImoiLCJzdGFydCIsIl9ub3JtYWxpemVQb2ludCIsImVuZCIsImEiLCJiIiwicmFkaXVzIiwiTWF0aCIsInNxcnQiLCJhcmMiLCJQSSIsIm1vdmVUbyIsImxpbmVUbyIsInN0cm9rZVN0eWxlIiwibGluZVdpZHRoIiwibGluZUpvaW4iLCJsaW5lQ2FwIiwidG9TdHJpbmciLCJwb3AiLCJjbGVhclJlY3QiLCJfZHJhd1N0cm9rZSIsIlNoYXBlIiwiTGluZSIsIlJlY3RhbmdsZSIsImNsYSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQTBCQSxJQUFNQSxPQUFPO0FBQ1hDLFFBQU0sQ0FESztBQUVYQyxRQUFNLENBRks7QUFHWEMsYUFBVyxDQUhBO0FBSVhDLFlBQVUsQ0FKQztBQUtYQyxXQUFTLENBTEU7QUFNWEMsVUFBUTtBQU5HLENBQWI7O0lBWU1DLFM7QUFtQkoscUJBQVlDLEVBQVosRUFBNkJDLElBQTdCLEVBQW1DO0FBQUE7O0FBQUE7O0FBQ2pDLFNBQUtELEVBQUwsR0FBVUEsRUFBVjtBQUNBLFNBQUtDLElBQUwsR0FBWUMsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0I7QUFDNUJDLGFBQU9KLEdBQUdLLFdBRGtCO0FBRTVCQyxjQUFRTixHQUFHSyxXQUZpQjtBQUc1QkUsa0JBQVksSUFIZ0I7QUFJNUJDLGNBQVE7QUFKb0IsS0FBbEIsRUFLVFAsSUFMUyxDQUFaOztBQU9BLFNBQUtRLFNBQUwsR0FBaUIsS0FBakI7QUFDQSxTQUFLQyxTQUFMLEdBQWlCLFNBQWpCO0FBQ0EsU0FBS0MsSUFBTCxHQUFZbkIsS0FBS0MsSUFBakI7O0FBRUEsU0FBS21CLE1BQUwsR0FBY0MsU0FBU0MsYUFBVCxDQUF1QixRQUF2QixDQUFkO0FBQ0EsU0FBS0YsTUFBTCxDQUFZRyxZQUFaLENBQXlCLGNBQXpCLEVBQXlDLElBQXpDO0FBQ0FmLE9BQUdnQixXQUFILENBQWUsS0FBS0osTUFBcEI7O0FBRUEsU0FBS0ssT0FBTCxHQUFpQixLQUFLTCxNQUFMLENBQVlNLFVBQVosQ0FBdUIsSUFBdkIsQ0FBakI7O0FBRUEsU0FBS0MsT0FBTCxHQUFlLEVBQWY7QUFDQSxTQUFLQyxLQUFMLEdBQWEsRUFBYjs7QUFFQSxTQUFLQyxZQUFMLEdBQW9CLEtBQUtwQixJQUFMLENBQVVHLEtBQVYsR0FB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Q0EsV0FBS3lDLE1BQUw7QUFDRDs7QUFFRDs7Ozs7OzZCQUdTO0FBQ1AsV0FBSzVDLE9BQUwsQ0FBYWtFLFNBQWIsQ0FBdUIsQ0FBdkIsRUFBMEIsQ0FBMUIsRUFBNkIsS0FBS3ZFLE1BQUwsQ0FBWVIsS0FBekMsRUFBZ0QsS0FBS1EsTUFBTCxDQUFZTixNQUE1RDs7QUFFQSxXQUFLLElBQUl5RCxJQUFJLENBQWIsRUFBZ0JBLElBQUksS0FBSzVDLE9BQUwsQ0FBYXNDLE1BQWpDLEVBQXlDTSxHQUF6QyxFQUE4QztBQUM1QyxhQUFLcUIsV0FBTCxDQUFpQixLQUFLakUsT0FBTCxDQUFhNEMsQ0FBYixDQUFqQjtBQUNEO0FBQ0Y7Ozs7OztJQUlHc0IsSzs7OztJQUtBQyxJOzs7Ozs7Ozs7O0VBQWFELEs7O0lBSWJFLFM7Ozs7Ozs7Ozs7RUFBa0JGLEs7O0FBSXhCRyIsImZpbGUiOiJyZXNwb25zaXZlLXNrZXRjaHBhZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmRlY2xhcmUgdHlwZSBQb2ludCA9IHtcbiAgeDogbnVtYmVyLFxuICB5OiBudW1iZXIsXG59O1xuXG5kZWNsYXJlIHR5cGUgU2VnbWVudCA9IHtcbiAgcG9pbnRzOiBQb2ludFtdLFxuICBjaXJjbGU/OiBib29sZWFuXG59XG5cbmRlY2xhcmUgdHlwZSBQYXRoID0ge1xuICBwb2ludHM6IFBvaW50W10sXG5cbn1cblxuZGVjbGFyZSB0eXBlIFN0cm9rZSA9IHtcbiAgc2VnbWVudHM6IFNlZ21lbnRbXSxcbiAgY29sb3I6IHN0cmluZyxcbiAgc2l6ZTogbnVtYmVyLFxuICBjYXA6IHN0cmluZyxcbiAgam9pbjogc3RyaW5nLFxuICBtaXRlckxpbWl0OiBudW1iZXIsXG59O1xuXG5jb25zdCBUT09MID0ge1xuICBGUkVFOiAwLFxuICBMSU5FOiAxLFxuICBSRUNUQU5HTEU6IDIsXG4gIFRSSUFOR0xFOiAzLFxuICBESUFNT05EOiA0LFxuICBDSVJDTEU6IDUsXG59XG5cbnR5cGUgVG9vbCA9IDB8MXwyfDN8NHw1O1xuXG5cbmNsYXNzIFNrZXRjaHBhZCB7XG4gIGVsOiBIVE1MRWxlbWVudDtcbiAgb3B0czoge1xuICAgIHdpZHRoOiBudW1iZXIsXG4gICAgaGVpZ2h0OiBudW1iZXIsXG4gICAgYXV0b1Jlc2l6ZT86IGJvb2xlYW4sXG4gICAgb25EcmF3PzogKFN0cm9rZVtdKSA9PiB2b2lkXG4gIH07XG5cbiAgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcbiAgY29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xuICBza2V0Y2hpbmc6IGJvb2xlYW47XG4gIHN0cm9rZXM6IFN0cm9rZVtdO1xuICB1bmRvczogU3Ryb2tlW107XG5cbiAgX2FzcGVjdFJhdGlvOiBudW1iZXJcbiAgdG9vbDogVG9vbDtcbiAgbGluZUNvbG9yOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoZWw6IEhUTUxFbGVtZW50LCBvcHRzKSB7XG4gICAgdGhpcy5lbCA9IGVsO1xuICAgIHRoaXMub3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIHtcbiAgICAgIHdpZHRoOiBlbC5jbGllbnRXaWR0aCxcbiAgICAgIGhlaWdodDogZWwuY2xpZW50V2lkdGgsXG4gICAgICBhdXRvUmVzaXplOiB0cnVlLFxuICAgICAgb25EcmF3OiBudWxsLFxuICAgIH0sIG9wdHMpO1xuXG4gICAgdGhpcy5za2V0Y2hpbmcgPSBmYWxzZTtcbiAgICB0aGlzLmxpbmVDb2xvciA9ICcjMDAwMDAwJztcbiAgICB0aGlzLnRvb2wgPSBUT09MLkZSRUU7XG5cbiAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHRoaXMuY2FudmFzLnNldEF0dHJpYnV0ZSgndW5zZWxlY3RhYmxlJywgJ29uJyk7XG4gICAgZWwuYXBwZW5kQ2hpbGQodGhpcy5jYW52YXMpO1xuXG4gICAgdGhpcy5jb250ZXh0ID0gKCh0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpOiBhbnkpOiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpO1xuXG4gICAgdGhpcy5zdHJva2VzID0gW107XG4gICAgdGhpcy51bmRvcyA9IFtdO1xuXG4gICAgdGhpcy5fYXNwZWN0UmF0aW8gPSB0aGlzLm9wdHMud2lkdGggLyB0aGlzLm9wdHMuaGVpZ2h0O1xuICAgIHRoaXMucmVzaXplKHRoaXMub3B0cy53aWR0aCk7XG5cbiAgICAvLyBNb3VzZSBFdmVudCBMaXN0ZW5lcnNcbiAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZTogTW91c2VFdmVudCkgPT4gdGhpcy5fc3RhcnRMaW5lKGUpKTtcbiAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgKGU6IE1vdXNlRXZlbnQpID0+IHRoaXMuX2RyYXdMaW5lKGUpKTtcbiAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZTogTW91c2VFdmVudCkgPT4gdGhpcy5fZHJhd0xpbmUoZSkpO1xuICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAoZTogTW91c2VFdmVudCkgPT4gdGhpcy5fZHJhd0xpbmUoZSkpO1xuICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCAoZTogTW91c2VFdmVudCkgPT4gdGhpcy5fZHJhd0xpbmUoZSkpO1xuXG4gICAgLy8gaWYgKGRvY3VtZW50LmJvZHkpIHtcbiAgICAvLyAgIGxldCBib2R5ID0gZG9jdW1lbnQuYm9keTtcbiAgICAvLyAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIChlOiBNb3VzZUV2ZW50KSA9PiB0aGlzLl9lbmRMaW5lKGUpKTtcbiAgICAvLyAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCAoZTogVG91Y2hFdmVudCkgPT4gdGhpcy5fZW5kTGluZShlKSk7XG4gICAgLy8gfVxuXG4gICAgLy8gVG91Y2ggRXZlbnQgTGlzdGVuZXJzXG4gICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIChlOiBUb3VjaEV2ZW50KSA9PiB0aGlzLl9zdGFydExpbmUoZSkpO1xuICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIChlOiBUb3VjaEV2ZW50KSA9PiB0aGlzLl9kcmF3TGluZShlKSk7XG5cbiAgICBpZiAodGhpcy5vcHRzLmF1dG9SZXNpemUpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoZSkgPT4gdGhpcy5yZXNpemUodGhpcy5lbC5jbGllbnRXaWR0aCkpO1xuICAgIH1cbiAgfVxuXG4gIF9nZXRDdXJzb3JSZWxhdGl2ZVRvQ2FudmFzKGU6IE1vdXNlRXZlbnR8VG91Y2hFdmVudCk6IFBvaW50IHtcbiAgICBsZXQgcG9pbnQ6IFBvaW50ID0ge3g6IDEsIHk6IDJ9O1xuICAgIGlmICgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cgJiYgZSBpbnN0YW5jZW9mIFRvdWNoRXZlbnQpIHtcbiAgICAgIGUgPSAoKGU6IGFueSk6IFRvdWNoRXZlbnQpXG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiAoZS50b3VjaGVzWzBdLnBhZ2VYIC0gdGhpcy5jYW52YXMub2Zmc2V0TGVmdCkgLyB0aGlzLmNhbnZhcy53aWR0aCxcbiAgICAgICAgeTogKGUudG91Y2hlc1swXS5wYWdlWSAtIHRoaXMuY2FudmFzLm9mZnNldFRvcCkgLyB0aGlzLmNhbnZhcy5oZWlnaHRcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZSA9ICgoZTogYW55KTogTW91c2VFdmVudCk7XG4gICAgICBsZXQgcmVjdCA9IHRoaXMuY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogKGUuY2xpZW50WCAtIHJlY3QubGVmdCkgLyB0aGlzLmNhbnZhcy53aWR0aCxcbiAgICAgICAgeTogKGUuY2xpZW50WSAtIHJlY3QudG9wKSAvIHRoaXMuY2FudmFzLmhlaWdodCxcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBfbm9ybWFsaXplUG9pbnQocG9pbnQ6IFBvaW50KTogUG9pbnQge1xuICAgIHJldHVybiB7XG4gICAgICB4OiBwb2ludC54ICogdGhpcy5jYW52YXMud2lkdGgsXG4gICAgICB5OiBwb2ludC55ICogdGhpcy5jYW52YXMuaGVpZ2h0XG4gICAgfVxuICB9XG5cbiAgX3N0YXJ0TGluZShlOiBNb3VzZUV2ZW50fFRvdWNoRXZlbnQpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKGUudHlwZSA9PSAnbW91c2VlbnRlcicgJiYgIXRoaXMuc2tldGNoaW5nKSByZXR1cm47XG5cbiAgICBsZXQgYm9keSA9IGRvY3VtZW50LmJvZHk7XG4gICAgaWYgKGJvZHkpIHtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIChlOiBNb3VzZUV2ZW50KSA9PiB0aGlzLl9lbmRMaW5lKGUpKTtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCAoZTogVG91Y2hFdmVudCkgPT4gdGhpcy5fZW5kTGluZShlKSk7XG4gICAgfVxuXG4gICAgdGhpcy5za2V0Y2hpbmcgPSB0cnVlO1xuXG4gICAgbGV0IHBvaW50ID0gdGhpcy5fZ2V0Q3Vyc29yUmVsYXRpdmVUb0NhbnZhcyhlKTtcbiAgICBsZXQgc3Ryb2tlOiBTdHJva2UgPSB7XG4gICAgICBzZWdtZW50czogW3twb2ludHM6IFtwb2ludF19XSxcbiAgICAgIGNvbG9yOiB0aGlzLmxpbmVDb2xvcixcbiAgICAgIHNpemU6IDUsXG4gICAgICBjYXA6ICdyb3VuZCcsXG4gICAgICBqb2luOiAncm91bmQnLFxuICAgICAgbWl0ZXJMaW1pdDogMTAsXG4gICAgfTtcblxuICAgIHRoaXMuc3Ryb2tlcy5wdXNoKHN0cm9rZSk7XG4gIH1cblxuICBfZHJhd0xpbmUoZTogTW91c2VFdmVudHxUb3VjaEV2ZW50KSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmICghdGhpcy5za2V0Y2hpbmcpIHJldHVybjtcblxuICAgIGxldCBwb2ludCA9IHRoaXMuX2dldEN1cnNvclJlbGF0aXZlVG9DYW52YXMoZSk7XG5cbiAgICBsZXQgc3Ryb2tlID0gdGhpcy5zdHJva2VzW3RoaXMuc3Ryb2tlcy5sZW5ndGggLSAxXTtcbiAgICBpZiAoZS50eXBlID09ICdtb3VzZWVudGVyJykge1xuICAgICAgc3Ryb2tlLnNlZ21lbnRzLnB1c2goe3BvaW50czogW119KTtcbiAgICB9XG5cbiAgICBsZXQgc2VnbWVudCA9IHN0cm9rZS5zZWdtZW50c1tzdHJva2Uuc2VnbWVudHMubGVuZ3RoIC0gMV07XG4gICAgbGV0IGZpcnN0UG9pbnQgPSBzZWdtZW50LnBvaW50c1swXTtcblxuICAgIGlmICh0aGlzLnRvb2wgPT0gVE9PTC5GUkVFKSB7XG4gICAgICBzZWdtZW50LnBvaW50cy5wdXNoKHBvaW50KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMudG9vbCA9PSBUT09MLkxJTkUpIHtcbiAgICAgIHNlZ21lbnQucG9pbnRzID0gW2ZpcnN0UG9pbnQsIHBvaW50XTtcbiAgICB9IGVsc2UgaWYgKHRoaXMudG9vbCA9PSBUT09MLlJFQ1RBTkdMRSkge1xuICAgICAgc2VnbWVudC5wb2ludHMgPSBbXG4gICAgICAgIGZpcnN0UG9pbnQsXG4gICAgICAgIHt4OiBwb2ludC54LCB5OiBmaXJzdFBvaW50Lnl9LFxuICAgICAgICBwb2ludCxcbiAgICAgICAge3g6IGZpcnN0UG9pbnQueCwgeTogcG9pbnQueX0sXG4gICAgICAgIGZpcnN0UG9pbnRcbiAgICAgIF1cbiAgICB9IGVsc2UgaWYgKHRoaXMudG9vbCA9PSBUT09MLlRSSUFOR0xFKSB7XG4gICAgICBzZWdtZW50LnBvaW50cyA9IFtcbiAgICAgICAgZmlyc3RQb2ludCxcbiAgICAgICAge3g6IChwb2ludC54ICsgZmlyc3RQb2ludC54KS8gMiwgeTogcG9pbnQueX0sXG4gICAgICAgIHt4OiBwb2ludC54LCB5OiBmaXJzdFBvaW50Lnl9LFxuICAgICAgICBmaXJzdFBvaW50LFxuICAgICAgXTtcbiAgICB9IGVsc2UgaWYgKHRoaXMudG9vbCA9PSBUT09MLkRJQU1PTkQpIHtcbiAgICAgIHNlZ21lbnQucG9pbnRzID0gW1xuICAgICAgICBmaXJzdFBvaW50LFxuICAgICAgICB7eDogKHBvaW50LnggKyBmaXJzdFBvaW50LngpLyAyLCB5OiBwb2ludC55fSxcbiAgICAgICAge3g6IHBvaW50LngsIHk6IGZpcnN0UG9pbnQueX0sXG4gICAgICAgIHt4OiAocG9pbnQueCArIGZpcnN0UG9pbnQueCkvIDIsIHk6IDIgKiBmaXJzdFBvaW50LnkgLSBwb2ludC55fSxcbiAgICAgICAgZmlyc3RQb2ludCxcbiAgICAgIF07XG4gICAgfSBlbHNlIGlmICh0aGlzLnRvb2wgPT0gVE9PTC5DSVJDTEUpIHtcbiAgICAgIHNlZ21lbnQucG9pbnRzID0gW2ZpcnN0UG9pbnQsIHBvaW50XTtcbiAgICAgIHNlZ21lbnQuY2lyY2xlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBzdHJva2Uuc2VnbWVudHNbc3Ryb2tlLnNlZ21lbnRzLmxlbmd0aCAtIDFdID0gc2VnbWVudDtcbiAgICB0aGlzLnJlZHJhdygpO1xuICAgIGlmICh0aGlzLm9wdHMub25EcmF3KSB7XG4gICAgICB0aGlzLm9wdHMub25EcmF3KHRoaXMuc3Ryb2tlcyk7XG4gICAgfVxuICB9XG5cbiAgX2VuZExpbmUoZTogTW91c2VFdmVudHxUb3VjaEV2ZW50KSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuc2tldGNoaW5nID0gZmFsc2U7XG4gIH1cblxuICBfZHJhd1N0cm9rZShzdHJva2U6IFN0cm9rZSkge1xuICAgIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3Ryb2tlLnNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgc2VnbWVudCA9IHN0cm9rZS5zZWdtZW50c1tpXTtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc2VnbWVudC5wb2ludHMubGVuZ3RoIC0gMTsgaisrKSB7XG4gICAgICAgIGxldCBzdGFydCA9IHRoaXMuX25vcm1hbGl6ZVBvaW50KHNlZ21lbnQucG9pbnRzW2pdKTtcbiAgICAgICAgbGV0IGVuZCA9IHRoaXMuX25vcm1hbGl6ZVBvaW50KHNlZ21lbnQucG9pbnRzW2ogKyAxXSk7XG5cbiAgICAgICAgaWYgKHNlZ21lbnQuY2lyY2xlKSB7XG4gICAgICAgICAgbGV0IGEgPSBzdGFydC54IC0gZW5kLng7XG4gICAgICAgICAgbGV0IGIgPSBzdGFydC55IC0gZW5kLnk7XG4gICAgICAgICAgbGV0IHJhZGl1cyA9IE1hdGguc3FydCgoYSAqIGEpICsgKGIgKiBiKSlcbiAgICAgICAgICB0aGlzLmNvbnRleHQuYXJjKHN0YXJ0LngsIHN0YXJ0LnksIHJhZGl1cywgMCwgMiAqIE1hdGguUEkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb250ZXh0Lm1vdmVUbyhzdGFydC54LCBzdGFydC55KTtcbiAgICAgICAgICB0aGlzLmNvbnRleHQubGluZVRvKGVuZC54LCBlbmQueSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSBzdHJva2UuY29sb3I7XG4gICAgdGhpcy5jb250ZXh0LmxpbmVXaWR0aCA9IHN0cm9rZS5zaXplO1xuICAgIHRoaXMuY29udGV4dC5saW5lSm9pbiA9IHN0cm9rZS5qb2luO1xuICAgIHRoaXMuY29udGV4dC5saW5lQ2FwID0gc3Ryb2tlLmNhcDtcbiAgICB0aGlzLmNvbnRleHQubWl0ZXJMaW1pdCA9IHN0cm9rZS5taXRlckxpbWl0O1xuICAgIHRoaXMuY29udGV4dC5zdHJva2UoKTtcbiAgfVxuXG4gIC8qKlxuICAqIFNldCB0aGUgdG9vbCB0byB1c2UgdG8gZHJhd1xuICAqL1xuICBzZXRUb29sKHRvb2w6IFRvb2wpIHtcbiAgICB0aGlzLnRvb2wgPSB0b29sO1xuICB9XG5cbiAgLyoqXG4gICogU2V0IHRoZSBjb2xvciBvZiB0aGUgc3Ryb2tlc1xuICAqL1xuICBzZXRMaW5lQ29sb3IoY29sb3I6IHN0cmluZykge1xuICAgIHRoaXMubGluZUNvbG9yID0gY29sb3I7XG4gIH1cblxuICAvKipcbiAgKiBSZXNpemUgdGhlIGNhbnZhc1xuICAqIE1haW50YWlucyBleGlzdGluZyBhc3BlY3QgcmF0aW8gdG8gY2FsY3VsYXRlIGhlaWdodFxuICAqL1xuICByZXNpemUod2lkdGg6IG51bWJlcikge1xuICAgIHRoaXMuY2FudmFzLnNldEF0dHJpYnV0ZSgnd2lkdGgnLCB3aWR0aC50b1N0cmluZygpKTtcbiAgICBsZXQgaGVpZ2h0ID0gd2lkdGggKiB0aGlzLl9hc3BlY3RSYXRpbztcbiAgICB0aGlzLmNhbnZhcy5zZXRBdHRyaWJ1dGUoJ2hlaWdodCcsIGhlaWdodC50b1N0cmluZygpKTtcbiAgICB0aGlzLnJlZHJhdygpO1xuICB9XG5cbiAgLyoqXG4gICogVW5kbyB0aGUgbGFzdCBzdHJva2VcbiAgKi9cbiAgdW5kbygpIHtcbiAgICBsZXQgc3Ryb2tlID0gdGhpcy5zdHJva2VzLnBvcCgpO1xuICAgIGlmIChzdHJva2UpIHtcbiAgICAgIHRoaXMudW5kb3MucHVzaChzdHJva2UpO1xuICAgICAgdGhpcy5yZWRyYXcoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgKiBSZWRvIHRoZSBsYXN0IHVuZG9cbiAgKi9cbiAgcmVkbygpIHtcbiAgICBsZXQgc3Ryb2tlID0gdGhpcy51bmRvcy5wb3AoKTtcbiAgICBpZiAoc3Ryb2tlKSB7XG4gICAgICB0aGlzLnN0cm9rZXMucHVzaChzdHJva2UpO1xuICAgICAgdGhpcy5yZWRyYXcoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgKiBDbGVhciB0aGUgY2FudmFzXG4gICovXG4gIGNsZWFyKCkge1xuICAgIHRoaXMuc3Ryb2tlcyA9IFtdO1xuICAgIHRoaXMudW5kb3MgPSBbXTtcbiAgICB0aGlzLnJlZHJhdygpO1xuICB9XG5cbiAgLyoqXG4gICogUmVkcmF3IHRoZSBjYW52YXNcbiAgKi9cbiAgcmVkcmF3KCkge1xuICAgIHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3Ryb2tlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5fZHJhd1N0cm9rZSh0aGlzLnN0cm9rZXNbaV0pO1xuICAgIH1cbiAgfVxufVxuXG5cbmNsYXNzIFNoYXBlIHtcbiAgc3RhcnQ6IFBvaW50O1xufVxuXG5cbmNsYXNzIExpbmUgZXh0ZW5kcyBTaGFwZSB7XG4gIGVuZDogUG9pbnRcbn1cblxuY2xhc3MgUmVjdGFuZ2xlIGV4dGVuZHMgU2hhcGUge1xuICBlbmQ6IFBvaW50XG59XG5cbmNsYVxuIl19