// Movable
;(function() {
  // 使用鼠标事件还是触摸事件
  const touchable = 'ontouchstart' in window;
  const events = {
    movestart: touchable ? 'touchstart' : 'mousedown',
    move: touchable ? 'touchmove' : 'mousemove',
    moveend: touchable ? 'touchend' : 'mouseup',
  };

  // 节流函数，防止事件触发太频繁
  function throttle(fn) {
    let ticking = false;
    return function() {
      const args = [].slice.call(arguments);
      if (!ticking) {
        window.requestAnimationFrame(function() {
          fn.apply(fn.binding || null, args);
          ticking = false;
        });
        ticking = true;
      }
    };
  }

  // 绑定事件到 document
  function on(event, fn) {
    document.addEventListener(event, fn);
  }

  // 从 document 解绑事件
  function off(event, fn) {
    document.removeEventListener(event, fn);
  }

  // 防止触发拖拽
  function preventDrag(e){
    e.stopPropagation();
    e.cancelBubble = true;
    if (! touchable) {
      e.preventDefault();
      e.returnValue = false;
    }
    return false;
  }

  function isMouseEvent(e) {
    return e instanceof MouseEvent;
  }

  function isTouchEvent(e) {
    return typeof TouchEvent != undefined && e instanceof TouchEvent;
  }

  function getEventPoint(e) {
    return isMouseEvent(e) ? e : (isTouchEvent(e) ? e.touches[0] : {});
  }

  /**
   * 拖动指定元素，并执行回调函数
   *
   * @param {Element} target 目标元素
   * @param {Function} move  移动回调
   */
  function Movable(options) {
    // 设置目标元素
    this.target = options.target;
    if (! this.target) {
      throw '必须指定目标元素';
    }

    // 设置移动范围
    this.container = options.container || window;
    if (this.container !== window && !this.container instanceof Element) {
      this.container = window;
    }

    // 设置偏移值
    this.offset = typeof options.offset == 'object' ? options.offset : {};
    this.offset.x = this.offset.x || 0;
    this.offset.y = this.offset.y || 0;

    // 移动事件的回调
    this.onmove = function() {};
    if (typeof options.onmove === 'function') {
      this.onmove = options.onmove;
    }

    // 限制移动方向
    this.dir = 'both';
    if (options.dir === 'x' || options.dir === 'y') {
      this.dir = options.dir;
    }

    // 开始拖动时，触点相对于目标边缘的偏移
    this.pointOffset = {};

    // 动画是否进行中
    this.ticking = false;

    this.stopped = true;

    this.start();
  }

  Movable.prototype = {
    constructor: Movable,

    // 开始拖动
    start: function start() {
      on(events.movestart, this.handleStart.bind(this));
      this.stopped = false;
    },

    // 停止
    stop: function stop() {
      this.stopped = true;
    },

    // 生成节流后的移动事件处理函数
    handleMove: function handleMove(e) {
      if (this.ticking) {
        return;
      }

      const _this = this;
      window.requestAnimationFrame(function() {
        preventDrag(e);
        const point = getEventPoint(e);
        const rect = _this.target.getBoundingClientRect();
        const containerRect = _this.getContainerRect();
        if (_this.dir === 'both' || _this.dir === 'x') {
          _this.target.style.left = Math.min(Math.max(point.clientX - _this.pointOffset.x - containerRect.clientX + _this.offset.x, 0 - _this.offset.x), containerRect.width - rect.width + _this.offset.x) + 'px';
        }
        if (_this.dir === 'both' || _this.dir === 'y') {
          _this.target.style.left = Math.min(Math.max(point.clientY - _this.pointOffset.y - containerRect.clientY + _this.offset.y, 0 - _this.offset.y), containerRect.height - rect.height + _this.offset.y) + 'px';
        }
        _this.onmove({
          target: e.target,
          clientX: point.clientX,
          clientY: point.clientY,
          pageX: point.pageX,
          pageY: point.pageY,
          screenX: point.screenX,
          screenY: point.screenY,
          offsetX: offset.x,
          offsetY: offset.y,
        });
      });
    },

    handleStart: function handleStart(e) {
      if (e.target === this.target) {
        preventDrag(e);
        const rect = this.target.getBoundingClientRect();
        const point = getEventPoint(e);
        this.pointOffset.x = point.clientX - rect.left;
        this.pointOffset.y = point.clientY - rect.top;
        on(events.moveend, this.handleEnd);
        on(events.move, this.handleMove);
      }
    },

    handleEnd: function handleEnd() {
      off(events.move, this.handleMove);
      off(events.moveend, this.handleEnd);
    },

    getContainerRect: function getContainerRect() {
      if (this.container === window) {
        return {
          width: window.innerWidth,
          height: window.innerHeight,
          left: 0,
          top: 0,
        };
      }
      return this.container.getBoundingClientRect();
    }
  };

  window.Movable = Movable;
})();
