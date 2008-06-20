YUI.add('dd-ddm-base', function(Y) {

    /**
     * 3.x DragDrop Manager - Base
     * @class DDM
     * @module dd-ddm-base
     * @namespace DD
     * @extends base
     * @extends event-target
     * @constructor
     */
     //TODO Add Event Bubbling??
    
    var DDMBase = function() {
    };

    DDMBase.NAME = 'DragDropMgr';

    DDMBase.ATTRS = {
        /**
        * @attribute clickPixelThresh
        * @description The number of pixels to move to start a drag operation, default is 3.
        * @type Number
        */        
        clickPixelThresh: {
            value: 3,
            set: function(p) {
                this.clickPixelThresh = p;
            }
        },
        /**
        * @attribute clickPixelThresh
        * @description The number of milliseconds a mousedown has to pass to start a drag operation, default is 1000.
        * @type Number
        */        
        clickTimeThresh: {
            value: 1000,
            set: function(p) {
                this.clickTimeThresh = p;
            }
        }

    };

    Y.mix(DDMBase, {
        /**
        * @property clickPixelThresh
        * @description The number of pixels moved needed to start a drag operation, default 3.
        * @type {Number}
        */
        clickPixelThresh: 3,
        /**
        * @property clickTimeThresh
        * @description The number of milliseconds a mousedown needs to exceed to start a drag operation, default 1000.
        * @type {Number}
        */
        clickTimeThresh: 1000,
        /**
        * @private
        * @property drags
        * @description Holder for all registered drag elements.
        * @type {Array}
        */
        drags: [],
        /**
        * @property activeDrag
        * @description A reference to the currently active draggable object.
        * @type {Drag}
        */
        activeDrag: false,
        /**
        * @private
        * @method regDrag
        * @description Adds a reference to the drag object to the DDM.drags array, called in the constructor of Drag.
        * @param {Drag} d The Drag object
        */
        regDrag: function(d) {
            this.drags[this.drags.length] = d;
        },
        /**
        * @private
        * @method unregDrag
        * @description Remove this drag object from the DDM.drags array.
        * @param {Drag} d The drag object.
        */
        unregDrag: function(d) {
            var tmp = [];
            Y.each(this.drags, function(n, i) {
                if (n !== d) {
                    tmp[tmp.length] = n;
                }
            });
            this.drags = tmp;
        },
        /**
        * @private
        * @method init
        * @description DDM's init method
        */
        init: function() {
            Y.Node.get('document').on('mousemove', this.move, this, true);
            Y.Node.get('document').on('mouseup', this.end, this, true);
        },
        /**
        * @private
        * @method start
        * @description Internal method used by Drag to signal the start of a drag operation
        * @param {Number} x The x position of the drag element
        * @param {Number} y The y position of the drag element
        * @param {Number} w The width of the drag element
        * @param {Number} h The height of the drag element
        */
        start: function(x, y, w, h) {
            this.startDrag.apply(this, arguments);
        },
        /**
        * @private
        * @method startDrag
        * @description Factory method to be overwritten by other DDM's
        * @param {Number} x The x position of the drag element
        * @param {Number} y The y position of the drag element
        * @param {Number} w The width of the drag element
        * @param {Number} h The height of the drag element
        */
        startDrag: function() {},
        /**
        * @private
        * @method endDrag
        * @description Factory method to be overwritten by other DDM's
        */
        endDrag: function() {},
        dropMove: function() {},
        /**
        * @private
        * @method end
        * @description Internal method used by Drag to signal the end of a drag operation
        */
        end: function() {
            if (this.activeDrag) {
                this.endDrag();
                this.activeDrag.end.call(this.activeDrag);
                this.activeDrag = null;
            }
        },
        /**
        * @private
        * @method move
        * @description Internal listener for the mousemove DOM event to pass to the Drag's move method.
        */
        move: function() {
            if (this.activeDrag) {
                this.activeDrag.move.apply(this.activeDrag, arguments);
                this.dropMove();
            }
        },
        /**
        * @method setXY
        * @description A simple method to set the top and left position from offsets instead of page coordinates
        * @param {Object} node The node to set the position of 
        * @param {Array} xy The Array of left/top position to be set.
        */
        setXY: function(node, xy) {
            var t = parseInt(node.getStyle('top'), 10),
            l = parseInt(node.getStyle('left'), 10),
            pos = node.getStyle('position');

            if (pos === 'static') {
                node.setStyle('position', 'relative');
            }

            // in case of 'auto'
            if (isNaN(t)) { t = 0; }
            if (isNaN(l)) { l = 0; }
            
            node.setStyle('top', (xy[1] + t) + 'px');
            node.setStyle('left', (xy[0] + l) + 'px');
        },
        /**
        * @method cssSizestoObject
        * @description Helper method to use to set the gutter from the attribute setter.
        * @param {String} gutter CSS style string for gutter: '5 0' (sets top and bottom to 5px, left and right to 0px), '1 2 3 4' (top 1px, right 2px, bottom 3px, left 4px)
        * @return {Object} The gutter Object Literal.
        */
        cssSizestoObject: function(gutter) {
            var p = gutter.split(' '),
            g = {
                top: 0,
                bottom: 0,
                right: 0,
                left: 0
            };
            if (p.length) {
                g.top = parseInt(p[0], 10);
                if (p[1]) {
                    g.right = parseInt(p[1], 10);
                } else {
                    g.right = g.top;
                }
                if (p[2]) {
                    g.bottom = parseInt(p[2], 10);
                } else {
                    g.bottom = g.top;
                }
                if (p[3]) {
                    g.left = parseInt(p[3], 10);
                } else if (p[1]) {
                    g.left = g.right;
                } else {
                    g.left = g.top;
                }
            }
            return g;
        },
        /**
        * @method getDrag
        * @description Get a valid Drag instance back from a Node or a selector string, false otherwise
        * @param {String/Object} node The Node instance or Selector string to check for a valid Drag Object
        * @return {Object}
        */
        getDrag: function(node) {
            var drag = false,
                n = Y.Node.get(node);
            if (n instanceof Y.Node) {
                Y.each(this.drags, function(v, k) {
                    if (n.compareTo(v.get('node'))) {
                        drag = v;
                    }
                });
            }
            return drag;
        }
    });

    Y.mix(DDMBase, Y.Base.prototype);

    Y.namespace('DD');
    Y.DD.DDM = DDMBase;
    Y.DD.DDM.init();



}, '@VERSION@' ,{requires:['node', 'nodeextras', 'base'], skinnable:false});
YUI.add('dd-ddm', function(Y) {

    /**
     * 3.x DragDrop Manager - Shim support
     * @module dd-ddm
     * @class DDM
     * @namespace DD
     * @extends Base
     * @constructor
     */
     //TODO Add Event Bubbling??

    Y.mix(Y.DD.DDM, {
        /**
        * @private
        * @property pg
        * @description The shim placed over the screen to track the mousemove event.
        * @type {Node}
        */
        pg: null,
        /**
        * @private
        * @property _debugShim
        * @description Set this to true to set the shims opacity to .5 for debugging it, default: false.
        * @type {Boolean}
        */
        _debugShim: false,
        _activateTargets: function() {},
        _deactivateTargets: function() {},
        startDrag: function() {
            if (this.activeDrag.get('useShim')) {
                this.pg_activate();
                this._activateTargets();
            }
        },
        endDrag: function() {
            this.pg_deactivate();
            this._deactivateTargets();
        },
        /**
        * @private
        * @method pg_deactivate
        * @description Deactivates the shim
        */
        pg_deactivate: function() {
            this.pg.setStyle('display', 'none');
        },
        /**
        * @private
        * @method pg_activate
        * @description Activates the shim
        */
        pg_activate: function() {
            this.pg_size();
            this.pg.setStyles({
                top: 0,
                left: 0,
                display: 'block',
                opacity: ((this._debugShim) ? '.5' : '0'),
                filter: 'alpha(opacity=' + ((this._debugShim) ? '50' : '0') + ')'
            });
        },
        /**
        * @private
        * @method pg_size
        * @description Sizes the shim on: activatation, window:scroll, window:resize
        */
        pg_size: function() {
            if (this.activeDrag) {
                var b = Y.Node.get('body'),
                h = b.get('docHeight'),
                w = b.get('docWidth');
                this.pg.setStyles({
                    height: h + 'px',
                    width: w + 'px'
                });
            }
        },
        /**
        * @private
        * @method _createPG
        * @description Creates the shim and adds it's listeners to it.
        */
        _createPG: function() {
            var pg = Y.Node.create(['div']),
            bd = Y.Node.get('body');
            pg.setStyles({
                top: '0',
                left: '0',
                position: 'absolute',
                zIndex: '9999',
                opacity: '0',
                backgroundColor: 'red',
                display: 'none',
                height: '5px',
                width: '5px'
            });
            if (bd.get('firstChild')) {
                bd.insertBefore(pg, bd.get('firstChild'));
            } else {
                bd.appendChild(pg);
            }
            this.pg = pg;
            this.pg.on('mouseup', this.end, this, true);
            this.pg.on('mousemove', this.move, this, true);
            //TODO
            Y.Event.addListener(window, 'resize', this.pg_size, this, true);
            Y.Event.addListener(window, 'scroll', this.pg_size, this, true);
        }   
    }, true);

    Y.DD.DDM._createPG();    


}, '@VERSION@' ,{requires:['dd-ddm-base'], skinnable:false});
YUI.add('dd-ddm-drop', function(Y) {

    /**
     * 3.x DragDrop Manager - Drop support
     * @class DDM
     * @module dd-ddm-drop
     * @namespace DD
     * @extends Base
     * @constructor
     */    
    Y.mix(Y.DD.DDM, {
        _activeShims: {},
        _hasActiveShim: function() {
            var ret = false;
            Y.each(this._activeShims, function(v, k) {
                if (k) {
                    ret = true;
                }
            }, this);

            return ret;
        },
        /**
        * @private
        * @property oldMode
        * @description Placeholder for the mode when the drag object changes it..
        * @type Number
        */
        oldMode: 0,
        /**
        * @property mode
        * @description The mode that the drag operations will run in 0 for Point, 1 for Intersect, 2 for Strict
        * @type Number
        */
        mode: 0,
        /**
        * @property POINT
        * @description In point mode, a Drop is targeted by the cursor being over the Target
        * @type Number
        */
        POINT: 0,
        /**
        * @property INTERSECT
        * @description In intersect mode, a Drop is targeted by "part" of the drag node being over the Target
        * @type Number
        */
        INTERSECT: 1,
        /**
        * @property STRICT
        * @description In strict mode, a Drop is targeted by the "entire" drag node being over the Target
        * @type Number
        */
        STRICT: 2,
        /**
        * @property useHash
        * @description Should we only check targets that are in the viewport on drags (for performance), default: true
        * @type {Boolean}
        */
        useHash: true,
        /**
        * @property activeDrop
        * @description A reference to the active Drop Target
        * @type {Object}
        */
        activeDrop: null,
        /**
        * @property validDrops
        * @description An array of the valid Drop Targets for this interaction.
        * @type {Array}
        */
        validDrops: [],
        /**
        * @property otherDrops
        * @description An object literal of Other Drop Targets that we encountered during this interaction (in the case of overlapping Drop Targets)
        * @type {Object}
        */
        otherDrops: {},
        /**
        * @property tars
        * @description All of the Targets
        * @type {Array}
        */
        tars: [],
        /**
        * @method addValid
        * @description Add a Drop Target to the list of Valid Targets. This list get's regenerated on each new drag operation.
        * @param {Object} drop
        * @return {Self}
        */
        addValid: function(drop) {
            this.validDrops[this.validDrops.length] = drop;
            return this;
        },
        /**
        * @method isOverTarget
        * @description Check to see if the Drag element is over the target, method varies on current mode
        * @param {Object} drop The drop to check against
        * @return {Boolean}
        */
        isOverTarget: function(drop) {
            if (Y.Lang.isObject(this.activeDrag) && drop) {
                var xy = this.activeDrag.mouseXY;
                if (xy) {
                    if (this.mode == this.STRICT) {
                        return this.activeDrag.get('dragNode').inRegion(drop.region, true, this.activeDrag.region);
                    } else {
                        return drop.shim.intersect({
                            top: xy[1],
                            bottom: xy[1],
                            left: xy[0], 
                            right: xy[0]
                        }, drop.region).inRegion;
                    }
                    
                } else {
                    return false;
                }
            } else {
                return false;
            }
        },
        /**
        * @private
        * @method clearCache
        * @description Clears the cache data used for this interaction.
        */
        clearCache: function() {
            this.validDrops = [];
            this.otherDrops = {};
        },
        /**
        * @private
        * @method _setMode
        * @description Private method to set the interaction mode based on the activeDrag's config
        */
        _setMode: function() {
            this._oldMode = this.mode;
            if (this.activeDrag && (this.activeDrag.get('dragMode') !== -1)) {
                this.mode = this.activeDrag.get('dragMode');
            }
        },
        /**
        * @private
        * @method _resetMode
        * @description Private method to reset the interaction mode to the default after a drag operation
        */
        _resetMode: function() {
            this.mode = this._oldMode;
        },

        /**
        * @private
        * @method _activateTargets
        * @description Clear the cache and activate the shims of all the targets
        */
        _activateTargets: function() {
            this._setMode();
            this.clearCache();
            Y.each(this.tars, function(v, k) {
                v.activateShim.apply(v, []);
                
            }, this);
            this._handleTargetOver();
            
        },
        /**
        * @method getBestMatch
        * @description This method will gather the area for all potential targets and see which has the hightest covered area and return it.
        * @param {Array} drops An Array of drops to scan for the best match.
        * @param {Boolean} all If present, it returns an Array. First item is best match, second is an Array of the other items in the original Array.
        * @return {Object or Array} 
        */
        getBestMatch: function(drops, all) {
            var biggest = null, area = 0;

            Y.each(drops, function(v, k) {
                var inter = this.activeDrag.get('dragNode').intersect(v.get('node'));
                v.region.area = inter.area;

                if (inter.inRegion) {
                    if (inter.area > area) {
                        area = inter.area;
                        biggest = v;
                    }
                }
            }, this);
            if (all) {
                var out = [];
                //TODO Sort the others in numeric order by area covered..
                Y.each(drops, function(v, k) {
                    if (v !== biggest) {
                        out[out.length] = v;
                    }
                }, this);
                return [biggest, out];
            } else {
                return biggest;
            }
        },
        /**
        * @private
        * @method _deactivateTargets
        * @description This method fires the drop:hit, drag:drophit, drag:dropmiss methods and deactivates the shims..
        */
        _deactivateTargets: function() {
            var other = [];
            
            if (this.activeDrag && !Y.Lang.isNull(this.activeDrop) && this.otherDrops[this.activeDrop]) {
                if (!this.mode) {
                    other = this.otherDrops;
                    delete other[this.activeDrop];
                } else {
                    var tmp = this.getBestMatch(this.otherDrops, true);
                    this.activeDrop = tmp[0];
                    other = tmp[1];
                }
                this.activeDrop.fire('drop:hit', { drag: this.activeDrag, drop: this.activeDrop, others: other });
                this.activeDrag.fire('drag:drophit', { drag: this.activeDrag,  drop: this.activeDrop, others: other });
            } else if (this.activeDrag) {
                this.activeDrag.fire('drag:dropmiss');
            } else {
            }
            
            this.activeDrop = null;

            Y.each(this.tars, function(v, k) {
                v.deactivateShim.apply(v, []);
            }, this);
            this._resetMode();
        },
        /**
        * @private
        * @method dropMove
        * @description This method is called when the move method is called on the Drag Object.
        * @param {Boolean} force Optional force at start.
        */
        dropMove: function(force) {
            if (this._hasActiveShim()) {
                this._handleTargetOver();
            } else {
                Y.each(this.otherDrops, function(v, k) {
                    v._handleOut.apply(v, []);
                });
            }
        },
        /**
        * @private
        * @method lookup
        * @description Filters the list of Drops down to those in the viewport.
        * @return {Array} The valid Drop Targets that are in the viewport.
        */
        lookup: function() {
            if (!this.useHash) {
                return this.validDrops;
            }
            var drops = [];
            //Only scan drop shims that are in the Viewport
            Y.each(this.validDrops, function(v, k) {
                if (v.shim.inViewportRegion(false, v.region)) {
                    drops[drops.length] = v;
                }
            });
            return drops;
                
        },
        /**
        * @private
        * @method _handleTargetOver
        * @description This method execs _handleTargetOver on all valid Drop Targets
        * @param {Boolean} force Force it to run the first time.
        */
        _handleTargetOver: function() {
            var drops = this.lookup();
            Y.each(drops, function(v, k) {
                v._handleTargetOver.call(v);
            }, this);
        },
        /**
        * @private
        * @method regTarget
        * @description Add the passed in Target to the tars collection
        * @param {Object} t The Target to add to the tars collection
        */
        regTarget: function(t) {
            this.tars[this.tars.length] = t;
        },
        /**
        * @private
        * @method unregTarget
        * @description Remove the passed in Target from the tars collection
        * @param {Object} t The Target to remove from the tars collection
        */
        unregTarget: function(t) {
            var tars = [];
            Y.each(this.tars, function(v, k) {
                if (v != t) {
                    tars[tars.length] = v;
                }
            }, this);
            this.tars = tars;
        },
        /**
        * @method rnd
        * @description Round a number to the nearest 100th.
        * @param {Number} The number to round
        * @return {Number} The rounded number
        */
        rnd: function(n) {
            return (Math.round(n / 100) * 100);
        },
        /**
        * @method getDrop
        * @description Get a valid Drop instance back from a Node or a selector string, false otherwise
        * @param {String/Object} node The Node instance or Selector string to check for a valid Drop Object
        * @return {Object}
        */
        getDrop: function(node) {
            var drop = false,
                n = Y.Node.get(node);
            if (n instanceof Y.Node) {
                Y.each(this.tars, function(v, k) {
                    if (n.compareTo(v.get('node'))) {
                        drop = v;
                    }
                });
            }
            return drop;
        }
    }, true);


}, '@VERSION@' ,{requires:['dd-ddm'], skinnable:false});
YUI.add('dd-drag', function(Y) {

    /**
     * 3.x DragDrop
     * @class Drag
     * @module dd-drag
     * @namespace DD
     * @extends base
     * @constructor
     */

    var DDM = Y.DD.DDM,
        NODE = 'node',
        DRAG_NODE = 'dragNode',
        OFFSET_HEIGHT = 'offsetHeight',
        OFFSET_WIDTH = 'offsetWidth',        
        MOUSE_UP = 'mouseup',
        MOUSE_DOWN = 'mousedown',
        EV_MOUSE_DOWN = 'drag:mouseDown',
        EV_AFTER_MOUSE_DOWN = 'drag:afterMouseDown',
        EV_REMOVE_HANDLE = 'drag:removeHandle',
        EV_ADD_HANDLE = 'drag:addHandle',
        EV_REMOVE_INVALID = 'drag:removeInvalid',
        EV_ADD_INVALID = 'drag:addInvalid',
        EV_START = 'drag:start',
        EV_END = 'drag:end',
        EV_DRAG = 'drag:drag';

        /*

        */
    
    var Drag = function() {
        Drag.superclass.constructor.apply(this, arguments);

        DDM.regDrag(this);
    };
    Drag.NAME = 'drag';

    Drag.ATTRS = {
        /**
        * @attribute node
        * @description Y.Node instanace to use as the element to initiate a drag operation
        * @type Node
        */
        node: {
            set: function(node) {
                return Y.Node.get(node);
            }
        },
        /**
        * @attribute dragNode
        * @description Y.Node instanace to use as the draggable element, defaults to node
        * @type Node
        */
        dragNode: {
            set: function(node) {
                return Y.Node.get(node);
            }
        },
        /**
        * @attribute offsetNode
        * @description Offset the drag element by the difference in cursor position: default true
        * @type Boolean
        */
        offsetNode: {
            value: true
        },
        /**
        * @attribute clickPixelThresh
        * @description The number of pixels to move to start a drag operation, default is 3.
        * @type Number
        */
        clickPixelThresh: {
            value: DDM.clickPixelThresh
        },
        /**
        * @attribute clickTimeThresh
        * @description The number of milliseconds a mousedown has to pass to start a drag operation, default is 1000.
        * @type Number
        */
        clickTimeThresh: {
            value: DDM.clickTimeThresh
        },
        /**
        * @attribute lock
        * @description Set to lock this drag element so that it can't be dragged: default false.
        * @type Boolean
        */
        lock: {
            value: false,
            set: function(lock) {
                if (lock) {
                    this.get(NODE).addClass('yui-dd-locked');
                } else {
                    this.get(NODE).removeClass('yui-dd-locked');
                }
            }
        },
        /**
        * @attribute data
        * @description A payload holder to store arbitrary data about this drag object, can be used to store any value.
        * @type Mixed
        */
        data: {
            value: false
        },
        /**
        * @attribute move
        * @description If this is false, the drag element will not move with the cursor: default true. Can be used to "resize" the element.
        * @type Boolean
        */
        move: {
            value: true
        },
        /**
        * @attribute useShim
        * @description Use the protective shim on all drag operations: default true. Only works with dd-ddm, not dd-ddm-base.
        * @type Boolean
        */
        useShim: {
            value: true
        },
        /**
        * @attribute activeHandle
        * @description This config option is set by Drag to inform you of which handle fired the drag event (in the case that there are several handles): default false.
        * @type Node
        */
        activeHandle: {
            value: false
        },
        /**
        * @attribute primaryButtonOnly
        * @description By default a drag operation will only begin if the mousedown occurred with the primary mouse button. Setting this to false will allow for all mousedown events to trigger a drag.
        * @type Boolean
        */
        primaryButtonOnly: {
            value: true
        },
        /**
        * @attribute dragging
        * @description This attribute is not meant to be used by the implementor, it is meant to be used as an Event tracker so you can listen for it to change.
        * @type Boolean
        */
        dragging: {
            value: false
        },
        /**
        * @attribute target
        * @description This attribute only works if the dd-drop module has been loaded. It will make this node a drop target as well as draggable.
        * @type Boolean
        */
        target: {
            value: false,
            set: function(config) {
                this._handleTarget(config);
            }
        },
        /**
        * @attribute dragMode
        * @description This attribute only works if the dd-drop module is active. It will make this node a drop target as well as draggable
        * @type Boolean
        */
        dragMode: {
            value: 'default',
            set: function(mode) {
                switch (mode) {
                    case 'point':
                        return 0;
                    case 'intersect':
                        return 1;
                    case 'strict':
                        return 2;
                    case 'default':
                        return -1;
                }
                return 'default';
            }
        },
        /**
        * @attribute groups
        * @description Array of groups to add this drag into.
        * @type Array
        */
        groups: {
            value: ['default'],
            set: function(g) {
                this._groups = {};
                Y.each(g, function(v, k) {
                    this._groups[v] = true;
                }, this);
            }
        }
    };

    Y.extend(Drag, Y.Base, {
        /**
        * @property target
        * @description This will be a reference to the Drop instance associated with this drag if the target: true config attribute is set..
        * @type {Object}
        */
        target: null,
        /**
        * @private
        * @method _handleTarget
        * @description Attribute handler for the target config attribute.
        * @param {Boolean/Object}
        * @return {Boolean/Object}
        */
        _handleTarget: function(config) {
            if (Y.DD.Drop) {
                if (config === false) {
                    if (this.target) {
                        DDM.unregTarget(this.target);
                        this.target = null;
                    }
                    return false;
                } else {
                    if (!Y.Lang.isObject(config)) {
                        config = {};
                    }
                    config.node = this.get(NODE);
                    this.target = new Y.DD.Drop(config);
                }
            } else {
                return false;
            }
        },
        /**
        * @private
        * @property _groups
        * @description Storage Array for the groups this drag belongs to.
        * @type {Array}
        */
        _groups: null,
        /**
        * @private
        * @method _createEvents
        * @description This method creates all the events for this Event Target and publishes them so we get Event Bubbling.
        */
        _createEvents: function() {
            
            this.publish(EV_MOUSE_DOWN, {
                defaultFn: this._handleMouseDown,
                emitFacade: true
            });

            var ev = [
                EV_AFTER_MOUSE_DOWN,
                EV_REMOVE_HANDLE,
                EV_ADD_HANDLE,
                EV_REMOVE_INVALID,
                EV_ADD_INVALID,
                EV_START,
                EV_END,
                EV_DRAG
            ];
            
            Y.each(ev, function(v, k) {
                this.publish(v, {
                    emitFacade: true,
                    preventable: false
                });
            }, this);

            this.addTarget(DDM);
            
        },
        /**
        * @private
        * @property _ev_md
        * @description A private reference to the mousedown DOM event
        * @type {Event}
        */
        _ev_md: null,
        /**
        * @private
        * @property _handles
        * @description A private hash of the valid drag handles
        * @type {Array}
        */
        _handles: null,
        /**
        * @private
        * @property _invalids
        * @description A private hash of the invalid selector strings
        * @type {Array}
        */
        _invalids: null,
        /**
        * @private
        * @property _dragThreshMet
        * @description Private flag to see if the drag threshhold was met
        * @type {Boolean}
        */
        _dragThreshMet: null,
        /**
        * @private
        * @property _fromTimeout
        * @description Flag to determine if the drag operation came from a timeout
        * @type {Boolean}
        */
        _fromTimeout: null,
        /**
        * @private
        * @property _clickTimeout
        * @description Holder for the setTimeout call
        * @type {Boolean}
        */
        _clickTimeout: null,
        /**
        * @property deltaXY
        * @description The offset of the mouse position to the element's position
        * @type {Array}
        */
        deltaXY: null,
        /**
        * @property startXY
        * @description The initial mouse position
        * @type {Array}
        */
        startXY: null,
        /**
        * @property nodeXY
        * @description The initial element position
        * @type {Array}
        */
        nodeXY: null,
        /**
        * @property lastXY
        * @description The position of the element as it's moving (for offset calculations)
        * @type {Array}
        */
        lastXY: null,
        /**
        * @property mouseXY
        * @description The XY coords of the mousemove
        * @type {Array}
        */
        mouseXY: null,
        /**
        * @property region
        * @description A region object associated with this drag, used for checking regions while dragging.
        * @type Object
        */
        region: null,       
        /**
        * @private
        * @method _handleMouseUp
        * @description Handler for the mouseup DOM event
        * @param {Event}
        */
        _handleMouseUp: function(ev) {
            this._fixIEMouseUp();
            if (DDM.activeDrag) {
                DDM.end();
            }
        },
        /** 
        * @private
        * @method _ieSelectFix
        * @description The function we use as the onselectstart handler when we start a drag in Internet Explorer
        */
        _ieSelectFix: function() {
            return false;
        },
        /** 
        * @private
        * @property _ieSelectBack
        * @description We will hold a copy of the current "onselectstart" method on this property, and reset it after we are done using it.
        */
        _ieSelectBack: null,
        _fixIEMouseDown: function() {
            if (Y.UA.ie) {
                this._ieSelectBack = document.body.onselectstart;
                document.body.onselectstart = this._ieSelectFix;
            }           
        },
        _fixIEMouseUp: function() {
            if (Y.UA.ie) {
                document.body.onselectstart = this._ieSelectBack;
            }           
        },
        /**
        * @private
        * @method _handleMouseDownEvent
        * @description Handler for the mousedown DOM event
        * @param {Event}
        */
        _handleMouseDownEvent: function(ev) {
            this.fire(EV_MOUSE_DOWN, { ev: ev });
        },
        /**
        * @private
        * @method _handleMouseDown
        * @description Handler for the mousedown DOM event
        * @param {Event}
        */
        _handleMouseDown: function(e) {
            var ev = e.ev;
            this._dragThreshMet = false;
            this._ev_md = ev;
            
            if (this.get('primaryButtonOnly') && ev.button > 1) {
                return false;
            }
            if (this.validClick(ev)) {
                this._fixIEMouseDown();
                ev.halt();
                this._setStartPosition([ev.pageX, ev.pageY]);

                DDM.activeDrag = this;

                var self = this;
                this._clickTimeout = setTimeout(function() {
                    self._timeoutCheck.call(self);
                }, this.get('clickTimeThresh'));
            }
            this.fire(EV_AFTER_MOUSE_DOWN, { ev: ev });
        },
        /**
        * @method validClick
        * @description Method first checks to see if we have handles, if so it validates the click against the handle. Then if it finds a valid handle, it checks it against the invalid handles list. Returns true if a good handle was used, false otherwise.
        * @param {Event}
        * @return {Boolean}
        */
        validClick: function(ev) {
            var r = false,
            tar = ev.target,
            hTest = null;
            if (this._handles) {
                Y.each(this._handles, function(i, n) {
                    if (Y.Lang.isString(n)) {
                        //Am I this or am I inside this
                        if (tar.test(n + ', ' + n + ' *')) {
                            hTest = n;
                            r = true;
                        }
                    }
                });
            } else {
                if (this.get(NODE).contains(tar) || this.get(NODE).compareTo(tar)) {
                    r = true;
                }
            }
            if (r) {
                if (this._invalids) {
                    Y.each(this._invalids, function(i, n) {
                        if (Y.Lang.isString(n)) {
                            //Am I this or am I inside this
                            if (tar.test(n + ', ' + n + ' *')) {
                                r = false;
                            }
                        }
                    });
                }
            }
            if (r) {
                if (hTest) {
                    var els = ev.originalTarget.queryAll(hTest);
                    els.each(function(n, i) {
                        if (n.contains(tar) || n.compareTo(tar)) {
                            this.set('activeHandle', els.item(i));
                        }
                    }, this);
                } else {
                    this.set('activeHandle', this.get(NODE));
                }
            }
            return r;
        },
        /**
        * @private
        * @method _setStartPosition
        * @description Sets the current position of the Element and calculates the offset
        * @param {Array} xy The XY coords to set the position to.
        */
        _setStartPosition: function(xy) {
            this.startXY = xy;
            
            this.nodeXY = this.get(NODE).getXY();
            this.lastXY = this.nodeXY;

            if (this.get('offsetNode')) {
                this.deltaXY = [(this.startXY[0] - this.nodeXY[0]), (this.startXY[1] - this.nodeXY[1])];
            } else {
                this.deltaXY = [0, 0];
            }
        },
        /**
        * @private
        * @method _timeoutCheck
        * @description The method passed to setTimeout to determine if the clickTimeThreshold was met.
        */
        _timeoutCheck: function() {
            if (!this.get('lock')) {
                this._fromTimeout = true;
                this._dragThreshMet = true;
                this.start();
                this.moveNode([this._ev_md.pageX, this._ev_md.pageY], true);
            }
        },
        /**
        * @method removeHandle
        * @description Remove a Selector added by addHandle
        * @param {String} str The selector for the handle to be removed. 
        * @return {Self}
        */
        removeHandle: function(str) {
            if (this._handles[str]) {
                delete this._handles[str];
                this.fire(EV_REMOVE_HANDLE, { handle: str });
            }
            return this;
        },
        /**
        * @method addHandle
        * @description Add a handle to a drag element. Drag only initiates when a mousedown happens on this element.
        * @param {String} str The selector to test for a valid handle. Must be a child of the element.
        * @return {Self}
        */
        addHandle: function(str) {
            if (!this._handles) {
                this._handles = {};
            }
            if (Y.Lang.isString(str)) {
                this._handles[str] = true;
                this.fire(EV_ADD_HANDLE, { handle: str });
            }
            return this;
        },
        /**
        * @method removeInvalid
        * @description Remove an invalid handle added by addInvalid
        * @param {String} str The invalid handle to remove from the internal list.
        * @return {Self}
        */
        removeInvalid: function(str) {
            if (this._invalids[str]) {
                delete this._handles[str];
                this.fire(EV_REMOVE_INVALID, { handle: str });
            }
            return this;
        },
        /**
        * @method addInvalid
        * @description Add a selector string to test the handle against. If the test passes the drag operation will not continue.
        * @param {String} str The selector to test against to determine if this is an invalid drag handle.
        * @return {Self}
        */
        addInvalid: function(str) {
            if (Y.Lang.isString(str)) {
                this._invalids[str] = true;
                this.fire(EV_ADD_INVALID, { handle: str });
            } else {
            }
            return this;
        },
        /**
        * @private
        * @method initializer
        * @description Internal init handler
        */
        initializer: function() {
            this._invalids = {};

            this._createEvents();
            
            if (!this.get(DRAG_NODE)) {
                this.set(DRAG_NODE, this.get(NODE));
            }
            
            this.get(NODE).addClass('yui-draggable');
            this.get(NODE).on(MOUSE_DOWN, this._handleMouseDownEvent, this, true);
            this.get(NODE).on(MOUSE_UP, this._handleMouseUp, this, true);
            this._dragThreshMet = false;
        },
        /**
        * @private
        * @method start
        * @description Starts the drag operation
        */
        start: function() {
            if (!this.get('lock')) {
                this.set('dragging', true);
                DDM.start(this.deltaXY, [this.get(NODE).get(OFFSET_HEIGHT), this.get(NODE).get(OFFSET_WIDTH)]);
                this.get(NODE).addClass('yui-dd-dragging');
                this.fire(EV_START);
                this.get(DRAG_NODE).on(MOUSE_UP, this._handleMouseUp, this, true);
                
                var xy = this.nodeXY;
                this.region = {
                    '0': xy[0], 
                    '1': xy[1],
                    area: 0,
                    top: xy[1],
                    right: xy[0] + this.get(NODE).get(OFFSET_WIDTH),
                    bottom: xy[1] + this.get(NODE).get(OFFSET_HEIGHT),
                    left: xy[0]
                };
                
            }
        },
        /**
        * @private
        * @method end
        * @description Ends the drag operation
        */
        end: function() {
            clearTimeout(this._clickTimeout);
            this._dragThreshMet = false;
            this._fromTimeout = false;
            if (!this.get('lock') && this.get('dragging')) {
                this.fire(EV_END);
            }
            this.get(NODE).removeClass('yui-dd-dragging');
            this.set('dragging', false);
            this.deltaXY = [0, 0];
            this.get(DRAG_NODE).detach(MOUSE_UP, this._handleMouseUp, this, true);
        },
        /**
        * @private
        * @method _align
        * @description Calculates the offsets and set's the XY that the element will move to.
        * @param {Array} xy The xy coords to align with.
        * @return Array
        * @type {Array}
        */
        _align: function(xy) {
            return [xy[0] - this.deltaXY[0], xy[1] - this.deltaXY[1]];
        },
        /**
        * @private
        * @method move
        * @description This method performs the actual element move.
        * @param {Array} eXY The XY to move the element to, usually comes from the mousemove DOM event.
        * @param {Boolean} noFire If true, the drag:drag event will not fire.
        */
        moveNode: function(eXY, noFire) {
            var xy = this._align(eXY), diffXY = [], diffXY2 = [];

            diffXY[0] = (xy[0] - this.lastXY[0]);
            diffXY[1] = (xy[1] - this.lastXY[1]);

            diffXY2[0] = (xy[0] - this.nodeXY[0]);
            diffXY2[1] = (xy[1] - this.nodeXY[1]);

            if (this.get('move')) {
                DDM.setXY(this.get(DRAG_NODE), diffXY);
            }

            this.region = {
                '0': xy[0], 
                '1': xy[1],
                area: 0,
                top: xy[1],
                right: xy[0] + this.get(NODE).get(OFFSET_WIDTH),
                bottom: xy[1] + this.get(NODE).get(OFFSET_HEIGHT),
                left: xy[0]
            };

            var startXY = this.nodeXY;
            if (!noFire) {
                this.fire(EV_DRAG, {
                    info: {
                        start: startXY,
                        xy: xy,
                        delta: diffXY,
                        offset: diffXY2
                    } 
                });
            }
            
            this.lastXY = xy;
        },
        /**
        * @private
        * @method move
        * @description Fired from DragDropMgr (DDM) on mousemove.
        * @param {Event} ev The mousemove DOM event
        */
        move: function(ev) {
            if (this.get('lock')) {
                return false;
            } else {
                this.mouseXY = [ev.pageX, ev.pageY];
                if (!this._dragThreshMet) {
                        var diffX = Math.abs(this.startXY[0] - ev.pageX);
                        var diffY = Math.abs(this.startXY[1] - ev.pageY);
                        if (diffX > this.get('clickPixelThresh') || diffY > this.get('clickPixelThresh')) {
                            this._dragThreshMet = true;
                            this.start();
                            this.moveNode([ev.pageX, ev.pageY]);
                        }
                
                } else {
                    clearTimeout(this._clickTimeout);
                    this.moveNode([ev.pageX, ev.pageY]);
                }
            }
        },
        /**
        * @private
        * @method destructor
        * @description Lifecycle destructor, unreg the drag from the DDM and remove listeners
        * @return {Self}
        */
        destructor: function() {
            DDM.unregDrag(this);
            this.get(NODE).detach(MOUSE_DOWN, this._handleMouseDownEvent, this, true);
            this.get(NODE).detach(MOUSE_UP, this._handleMouseUp, this, true);
        },
        /**
        * @method toString
        * @description General toString method for logging
        * @return String name for the object
        */
        toString: function() {
            return 'Drag';
        }
    });
    Y.namespace('DD');    
    Y.DD.Drag = Drag;


}, '@VERSION@' ,{requires:['dd-ddm-base'], skinnable:false});
YUI.add('dd-proxy', function(Y) {

    /**
     * 3.x DragDrop
     * @class Proxy
     * @module dd-proxy
     * @namespace DD
     * @extends Drag
     * @constructor
     */
    var DDM = Y.DD.DDM,
        NODE = 'node',
        DRAG_NODE = 'dragNode',
        FIRST_CHILD = 'firstChild',
        PROXY = 'proxy';
     

    var Proxy = function() {
        Proxy.superclass.constructor.apply(this, arguments);

    };

    Proxy.ATTRS = {
        /**
        * @attribute moveOnEnd
        * @description Move the original node at the end of the drag. Default: true
        * @type Boolean
        */
        moveOnEnd: {
            value: true
        },
        /**
        * @attribute resizeFrame
        * @description Make the Proxy node assume the size of the original node. Default: true
        * @type Boolean
        */
        resizeFrame: {
            value: true
        },
        /**
        * @attribute proxy
        * @description Make this Draggable instance a Proxy instance. Default: false
        * @type Boolean
        */
        proxy: {
            writeOnce: true,
            value: false
        },        
        /**
        * @attribute positionProxy
        * @description Make the Proxy node appear in the same place as the original node. Default: true
        * @type Boolean
        */
        positionProxy: {
            value: true
        },
        /**
        * @attribute borderStyle
        * @description The default border style for the border of the proxy. Default: 1px solid #808080
        * @type Boolean
        */
        borderStyle: {
            value: '1px solid #808080'
        }
    };

    var proto = {
        /**
        * @private
        * @method _createFrame
        * @description Create the proxy element if it doesn't already exist and set the DD.DDM._proxy value
        */
        _createFrame: function() {
            if (!DDM._proxy) {
                DDM._proxy = true;
                var p = Y.Node.create(['div']),
                bd = Y.Node.get('body');

                p.setStyles({
                    position: 'absolute',
                    display: 'none',
                    zIndex: '999',
                    border: this.get('borderStyle')
                });

                if (bd.get(FIRST_CHILD)) {
                    bd.insertBefore(p, bd.get(FIRST_CHILD));
                } else {
                    bd.appendChild(p);
                }
                p.set('id', Y.stamp(p));
                p.addClass('yui-dd-proxy');
                DDM._proxy = p;
            }
        },
        /**
        * @private
        * @method _setFrame
        * @description If resizeProxy is set to true (default) it will resize the proxy element to match the size of the Drag Element.
        * If positionProxy is set to true (default) it will position the proxy element in the same location as the Drag Element.
        */
        _setFrame: function() {
            var n = this.get(NODE);
            if (this.get('resizeFrame')) {
                DDM._proxy.setStyles({
                    height: n.get('clientHeight') + 'px',
                    width: n.get('clientWidth') + 'px'
                });
            }
            this.get(DRAG_NODE).setStyles({
                visibility: 'hidden',
                display: 'block',
                border: this.get('borderStyle')
            });

            if (this.get('positionProxy')) {
                this.get(DRAG_NODE).setXY(this.nodeXY);
            }
            this.get(DRAG_NODE).setStyle('visibility', 'visible');
        },
        /**
        * @private
        * @method initializer
        * @description Lifecycle method
        */
        initializer: function() {
            if (this.get(PROXY)) {
                this._createFrame();
            }
        },
        /**
        * @private
        * @method start
        * @description Starts the drag operation and sets the dragNode config option.
        */       
        start: function() {
            if (!this.get('lock')) {
                if (this.get(PROXY)) {
                    if (this.get(DRAG_NODE).compareTo(this.get(NODE))) {
                        this.set(DRAG_NODE, DDM._proxy);
                    }
                }
            }
            Proxy.superclass.start.apply(this);
            if (this.get(PROXY)) {
                this._setFrame();
            }
        },
        /**
        * @private
        * @method end
        * @description Ends the drag operation, if moveOnEnd is set it will position the Drag Element to the new location of the proxy.
        */        
        end: function() {
            if (this.get(PROXY)) {
                if (this.get('moveOnEnd')) {
                    this.get(NODE).setXY(this.lastXY);
                }
                this.get(DRAG_NODE).setStyle('display', 'none');
            }
            Proxy.superclass.end.apply(this);
        }
    };
    //Extend DD.Drag
    Y.extend(Proxy, Y.DD.Drag, proto);
    //Set this new class as DD.Drag for other extensions
    Y.DD.Drag = Proxy;


}, '@VERSION@' ,{requires:['dd-drag'], skinnable:false});
YUI.add('dd-constrain', function(Y) {

    /**
     * 3.x DragDrop
     * @class DragConstained
     * @namespace DD
     * @module dd-constrain
     * @extends Drag
     * @constructor
     */

    var DRAG_NODE = 'dragNode',
        OFFSET_HEIGHT = 'offsetHeight',
        OFFSET_WIDTH = 'offsetWidth';


    var C = function() {
        C.superclass.constructor.apply(this, arguments);

    };
    

    C.ATTRS = {
        /**
        * @attribute stickX
        * @description Stick the drag movement to the X-Axis. Default: false
        * @type Boolean
        */        
        stickX: {
            value: false
        },
        /**
        * @attribute stickY
        * @description Stick the drag movement to the Y-Axis
        * @type Boolean
        */        
        stickY: {
            value: false
        },
        /**
        * @attribute tickX
        * @description The X tick offset the drag node should snap to on each drag move. False for no ticks. Default: false
        * @type Number/false
        */        
        tickX: {
            value: false
        },
        /**
        * @attribute tickY
        * @description The Y tick offset the drag node should snap to on each drag move. False for no ticks. Default: false
        * @type Number/false
        */        
        tickY: {
            value: false
        },
        /**
        * @attribute tickXArray
        * @description An array of page coordinates to use as X ticks for drag movement.
        * @type Array
        */
        tickXArray: {
            value: false
        },
        /**
        * @attribute tickYArray
        * @description An array of page coordinates to use as Y ticks for drag movement.
        * @type Array
        */
        tickYArray: {
            value: false
        },
        /**
        * @attribute constrain2region
        * @description An Object Literal containing a valid region (top, right, bottom, left) of page positions to constrain the drag node to.
        * @type Object
        */
        constrain2region: {
            value: false,
            get: function(r) {
                if (Y.Lang.isObject(r)) {
                    var o = {};
                    Y.mix(o, r);
                    return o;
                } else {
                    return false;
                }
            },
            set: function (r) {
                if (Y.Lang.isObject(r)) {
                    if (r.top && r.right && r.left && r.bottom) {
                        var o = {};
                        Y.mix(o, r);
                        return o;
                    } else {
                        return false;
                    }
                } else if (r !== false) {
                    return false;
                }
            }
        },
        /**
        * @attribute gutter
        * @description CSS style string for the gutter of a region (supports negative values): '5 0' (sets top and bottom to 5px, left and right to 0px), '1 2 3 4' (top 1px, right 2px, bottom 3px, left 4px)        
        * @type String
        */
        gutter: {
            value: '0',
            set: function(gutter) {
                return Y.DD.DDM.cssSizestoObject(gutter);
            }
        },
        /**
        * @attribute constrain2node
        * @description Will attempt to constrain the drag node to the bounderies of this node.
        * @type Object
        */
        constrain2node: {
            value: false,
            set: function(n) {
                if (!this.get('constrain2region')) {
                    var node = Y.Node.get(n);
                    if (node) {
                        return node;
                    }
                } else if (this.get('constrain2region') !== false) {
                }
                return false;
            }
        },
        /**
        * @attribute constrain2view
        * @description Will attempt to constrain the drag node to the bounderies of the viewport region.
        * @type Object
        */
        constrain2view: {
            value: false
        }
    };

    var proto = {
        /**
        * @method getRegion
        * @description Get the active region: viewport, node, custom region
        * @param {Boolean} inc Include the node's height and width
        * @return {Object}
        */
        getRegion: function(inc) {
            var r = {};
            if (this.get('constrain2node')) {
                r = this.get('constrain2node').getRegion();
            } else if (this.get('constrain2region')) {
                r = this.get('constrain2region');
            } else if (this.get('constrain2view')) {
                r = this.get('node').get('viewportRegion');
            } else {
                return false;
            }
            var g = this.get('gutter');
            Y.each(g, function(i, n) {
                if ((n == 'right') || (n == 'bottom')) {
                    r[n] -= i;
                } else {
                    r[n] += i;
                }
            });
            if (inc) {
                var oh = this.get(DRAG_NODE).get(OFFSET_HEIGHT),
                    ow = this.get(DRAG_NODE).get(OFFSET_WIDTH);
                r.right = r.right - ow;
                r.bottom = r.bottom - oh;
            }
            return r;
        },
        /**
        * @private
        * @method _checkRegion
        * @description
        * @param {Array} _xy The XY to check if it's in the current region, if it isn't inside the region, it will reset the xy array to be inside the region.
        * @return {Array} The new XY that is inside the region
        */
        _checkRegion: function(_xy) {
            var oxy = _xy,
                r = this.getRegion(),
                oh = this.get(DRAG_NODE).get(OFFSET_HEIGHT),
                ow = this.get(DRAG_NODE).get(OFFSET_WIDTH);

            if (r.top > oxy[1]) {
                oxy[1] = r.top;

            }
            if (oxy[1] > (r.bottom - oh)) {
                oxy[1] = (r.bottom - oh);
            }
            if (r.left > oxy[0]) {
                oxy[0] = r.left;
            }
            if (oxy[0] > (r.right - ow)) {
                oxy[0] = (r.right - ow);
            }

            return oxy;
        },
        /**
        * @method inRegion
        * @description Checks if the XY passed or the dragNode is inside the active region.
        * @param {Array} xy Optional XY to check, if not supplied this.get('dragNode').getXY() is used.
        * @return {Boolean} True if the XY is inside the region, false otherwise.
        */
        inRegion: function(xy) {
            xy = xy || this.get(DRAG_NODE).getXY();

            var _xy = this._checkRegion([xy[0], xy[1]]),
                inside = false;
                if ((xy[0] === _xy[0]) && (xy[1] === _xy[1])) {
                    inside = true;
                }
            return inside;
        },
        /**
        * @private
        * @method _align
        * @description Override of Drag _align to account for region checking and tick checking
        * @param {Array} xy The XY to check for ticks and region
        * @return {Array} The modified XY coords.
        */
        _align: function(xy) {
            var _xy = C.superclass._align.apply(this, arguments),
                r = this.getRegion(true);
            if (this.get('stickX')) {
                _xy[1] = (this.startXY[1] - this.deltaXY[1]);
            }
            if (this.get('stickY')) {
                _xy[0] = (this.startXY[0] - this.deltaXY[0]);
            }


            if (r) {
                _xy = this._checkRegion(_xy);
            }
                
            _xy = this._checkTicks(_xy, r);
            return _xy;
        },
        /**
        * @private
        * @method _calcTicks
        * @description Helper method to calculate the tick offsets for a given position
        * @param {Number} pos The current X or Y position
        * @param {Number} start The start X or Y position
        * @param {Number} tick The X or Y tick increment
        * @param {Number} off1 The min offset that we can't pass (region)
        * @param {Number} off2 The max offset that we can't pass (region)
        * @return {Number} The new position based on the tick calculation
        */
        _calcTicks: function(pos, start, tick, off1, off2) {
            var ix = ((pos - start) / tick),
                min = Math.floor(ix),
                max = Math.ceil(ix);
                if ((min !== 0) || (max !== 0)) {
                    if ((ix >= min) && (ix <= max)) {
                        pos = (start + (tick * min));
                        if (off1 && off2) {
                            if (pos < off1) {
                                pos = (start + (tick * (min + 1)));
                            }
                            if (pos > off2) {
                                pos = (start + (tick * (min - 1)));
                            }
                        }
                    }
                }
                return pos;
        },
        /**
        * @private
        * @method _calcTickArray
        * @description This method is used with the tickXArray and tickYArray config options
        * @param {Number} pos The current X or Y position
        * @param {Number} ticks The array containing our custom tick positions.
        * @param {Number} off1 The min offset that we can't pass (region)
        * @param {Number} off2 The max offset that we can't pass (region)
        * @return The tick position
        */
        _calcTickArray: function(pos, ticks, off1, off2) {
            var i = 0, len = ticks.length, next = 0;

            if (!ticks || (ticks.length === 0)) {
                return pos;
            } else if (ticks[0] >= pos) {
                return ticks[0];
            } else {
                for (i = 0; i < len; i++) {
                    next = (i + 1);
                    if (ticks[next] && ticks[next] >= pos) {
                        var diff1 = pos - ticks[i],
                            diff2 = ticks[next] - pos;
                        var ret = (diff2 > diff1) ? ticks[i] : ticks[next];
                        if (off1 && off2) {
                            if (ret > off2) {
                                if (ticks[i]) {
                                    ret = ticks[i];
                                } else {
                                    ret = ticks[len - 1];
                                }
                            }
                        }
                        return ret;
                    }
                    
                }
                return ticks[ticks.length - 1];
            }
        },
        /**
        * @private
        * @method _checkTicks
        * @description This method delegates the proper helper method for tick calculations
        * @param {Array} xy The XY coords for the Drag
        * @param {Object} r The optional region that we are bound to.
        * @return {Array} The calced XY coords
        */
        _checkTicks: function(xy, r) {
            var lx = (this.startXY[0] - this.deltaXY[0]),
                ly = (this.startXY[1] - this.deltaXY[1]),
                xt = this.get('tickX'),
                yt = this.get('tickY');
                if (xt && !this.get('tickXArray')) {
                    xy[0] = this._calcTicks(xy[0], lx, xt, r.left, r.right);
                }
                if (yt && !this.get('tickYArray')) {
                    xy[1] = this._calcTicks(xy[1], ly, yt, r.top, r.bottom);
                }
                if (this.get('tickXArray')) {
                    xy[0] = this._calcTickArray(xy[0], this.get('tickXArray'), r.left, r.right);
                }
                if (this.get('tickYArray')) {
                    xy[1] = this._calcTickArray(xy[1], this.get('tickYArray'), r.top, r.bottom);
                }

            return xy;
        }
    };
    //Extend DD.Drag
    Y.extend(C, Y.DD.Drag, proto);
    //Set this to DD.Drag for other extensions
    Y.DD.Drag = C;


}, '@VERSION@' ,{requires:['dd-drag', 'dd-proxy'], skinnable:false});
YUI.add('dd-plugin', function(Y) {

       /**
        * 3.x DragDrop
        * @class DragPlugin
        * @module dd-plugin
        * @namespace Plugin
        * @extends drag
        * @constructor
        */

        Y.Plugin = Y.Plugin || {};

        var Drag = function(config) {
            config.node = config.owner;
            Drag.superclass.constructor.apply(this, arguments);
        };

        Drag.NAME = "dd-plugin";
        Drag.NS = "dd";


        Y.extend(Drag, Y.DD.Drag);
        Y.Plugin.Drag = Drag;



}, '@VERSION@' ,{skinnable:false, requires:['dd-drag'], optional:['dd-constrain', 'dd-proxy']});
YUI.add('dd-drop', function(Y) {

    /**
     * 3.x DragDrop
     * @class Drop
     * @module dd-drop
     * @namespace DD
     * @extends base
     * @constructor
     */

    var NODE = 'node',
        DDM = Y.DD.DDM,
        OFFSET_HEIGHT = 'offsetHeight',
        OFFSET_WIDTH = 'offsetWidth';

    var Drop = function() {
        Drop.superclass.constructor.apply(this, arguments);

        this.createShim();
        DDM.regTarget(this);
        /* TODO
        if (Dom.getStyle(this.el, 'position') == 'fixed') {
            Event.on(window, 'scroll', function() {
                this.activateShim();
            }, this, true);
        }
        */
    };

    Drop.NAME = 'drop';

    Drop.ATTRS = {
        node: {
            set: function(node) {
                return Y.Node.get(node);
            }
        },
        groups: {
            value: ['default'],
            set: function(g) {
                this._groups = {};
                Y.each(g, function(v, k) {
                    this._groups[v] = true;
                }, this);
            }
        },        
        padding: {
            value: '0',
            set: function(p) {
                return DDM.cssSizestoObject(p);
            }
        },
        lock: {
            value: false,
            set: function(lock) {
                if (lock) {
                    this.get(NODE).addClass('yui-dd-drop-locked');
                } else {
                    this.get(NODE).removeClass('yui-dd-drop-locked');
                }
            }
        }
    };

    Y.extend(Drop, Y.Base, {
        /**
        * @private
        * @method _createEvents
        * @description This method creates all the events for this Event Target and publishes them so we get Event Bubbling.
        */
        _createEvents: function() {
            
            var ev = [
                'drop:over',
                'drop:enter',
                'drop:exit'
            ];

            Y.each(ev, function(v, k) {
                this.publish(v, {
                    emitFacade: true,
                    preventable: false
                });
            }, this);

            this.addTarget(DDM);
            
        },
        /**
        * @private
        * @property _active
        * @description Is the target active and ready to be used..
        * @type Boolean
        */
        _active: null,
        /**
        * @private
        * @property _valid
        * @description Flag for determining if the target is valid in this operation.
        * @type Boolean
        */
        _valid: null,
        /**
        * @private
        * @property _groups
        * @description The groups this target belongs to.
        * @type Array
        */
        _groups: null,
        /**
        * @property shim
        * @description Node reference to the targets shim
        * @type {Object}
        */
        shim: null,
        /**
        * @property region
        * @description A region object associated with this target, used for checking regions while dragging.
        * @type Object
        */
        region: null,
        /**
        * @property overTarget
        * @description This flag is tripped when a drag element is over this target.
        * @type Boolean
        */
        overTarget: null,
        /**
        * @method inGroup
        * @description Check if this target is in one of the supplied groups.
        * @param {Array} groups The groups to check against
        * @return Boolean
        */
        inGroup: function(groups) {
            this._valid = false;
            var ret = false;
            Y.each(groups, function(v, k) {
                if (this._groups[v]) {
                    ret = true;
                    this._valid = true;
                }
            }, this);
            return ret;
        },
        /**
        * @private
        * @method initializer
        * @description Private lifecycle method
        */
        initializer: function() {
            this._createEvents();
        },
        /**
        * @private
        * @method deactivateShim
        * @description Removes classes from the target, resets some flags and sets the shims deactive position [-999, -999]
        */
        deactivateShim: function() {
            this.get(NODE).removeClass('dd-drop-active-valid');
            this.get(NODE).removeClass('dd-drop-active-invalid');
            this.get(NODE).removeClass('dd-drop-over');
            this.shim.setXY([-999, -999]);
            this._active = false;
            this.overTarget = false;
        },
        /**
        * @private
        * @method activateShim
        * @description Activates the shim and adds some interaction CSS classes
        */
        activateShim: function() {
            if (this.get(NODE) === DDM.activeDrag.get(NODE)) {
                return false;
            }
            if (this.get('lock')) {
                return false;
            }
            
            //if (this.inGroup(DDM.activeDrag.get('groups')) && this.get(NODE).isVisible()) { //TODO
            if (this.inGroup(DDM.activeDrag.get('groups'))) {
                this.get(NODE).addClass('dd-drop-active-valid');
                DDM.addValid(this);
                this._active = false;
                this.overTarget = false;
                this.sizeShim();
            } else {
                this.get(NODE).addClass('dd-drop-active-invalid');
            }
        },
        /**
        * @method sizeShim
        * @description Positions and sizes the shim with the raw data from the node, this can be used to programatically adjust the Targets shim for Animation..
        */
        sizeShim: function() {
            var nh = this.get(NODE).get(OFFSET_HEIGHT),
                nw = this.get(NODE).get(OFFSET_WIDTH),
                xy = this.get(NODE).getXY(),
                p = this.get('padding');

            //Apply padding
            nw = nw + p.left + p.right;
            nh = nh + p.top + p.bottom;
            xy[0] = xy[0] - p.left;
            xy[1] = xy[1] - p.top;
            

            if (DDM.mode === DDM.INTERSECT) {
                //Intersect Mode, make the shim bigger
                var dd = DDM.activeDrag,
                    dH = dd.get(NODE).get(OFFSET_HEIGHT),
                    dW = dd.get(NODE).get(OFFSET_WIDTH);
                
                nh = (nh + dH);
                nw = (nw + dW);
                xy[0] = xy[0] - (dH - dd.deltaXY[0]);
                xy[1] = xy[1] - (dW - dd.deltaXY[1]);
            }
            
            //Set the style on the shim
            this.shim.setStyles({
                height: nh + 'px',
                width: nw + 'px',
                top: xy[1] + 'px',
                left: xy[0] + 'px'
            });
            
            //Create the region to be used by intersect when a drag node is over us.
            this.region = {
                '0': xy[0], 
                '1': xy[1],
                area: 0,
                top: xy[1],
                right: xy[0] + nw,
                bottom: xy[1] + nh,
                left: xy[0]
            };
        },
        /**
        * @private
        * @method createShim
        * @description Creates the Target shim and adds it to the DDM's playground..
        */
        createShim: function() {
            var s = Y.Node.create(['div', { id: this.get(NODE).get('id') + '_shim' }]);
            s.setStyles({
                height: this.get(NODE).get(OFFSET_HEIGHT) + 'px',
                width: this.get(NODE).get(OFFSET_WIDTH) + 'px',
                backgroundColor: 'yellow',
                opacity: '.5',
                zIndex: 10,
                position:  'absolute'
            });
            DDM.pg.appendChild(s);
            s.setXY([-900, -900]);
            this.shim = s;

            s.on('mouseover', this._handleOverEvent, this, true);
            s.on('mouseout', this._handleOutEvent, this, true);
        },
        /**
        * @private
        * @method _handleOverTarget
        * @description This handles the over target call made from this object or from the DDM
        * @param force Force a check on initialization
        */
        _handleTargetOver: function(force) {
            if (DDM.isOverTarget(this)) {
                this.get(NODE).addClass('dd-drop-over');
                DDM.activeDrop = this;
                DDM.otherDrops[this] = this;
                if (this.overTarget) {
                    this.fire('drop:over');
                    DDM.activeDrag.fire('drag:over', { drop: this });
                } else {
                    this.overTarget = true;
                    this.fire('drop:enter');
                    DDM.activeDrag.fire('drag:enter', { drop: this });
                    DDM._handleTargetOver(this, force);
                }
            } else {
                this._handleOut();
            }
            
        },
        /**
        * @private
        * @method _handleOverEvent
        * @description Handles the mouseover DOM event on the Target Shim
        */
        _handleOverEvent: function() {
            DDM._activeShims[this] = true;
        },
        /**
        * @private
        * @method _handleOut
        * @description Handles the mouseout DOM event on the Target Shim
        */
        _handleOutEvent: function() {
            delete DDM._activeShims[this];
        },
        /**
        * @private
        * @method _handleOut
        * @description Handles out of target calls/checks
        */
        _handleOut: function() {
            if (!DDM.isOverTarget(this)) {
                if (this.overTarget) {
                    this.overTarget = false;
                    if (DDM.activeDrag) {
                        this.fire('drop:exit');
                        DDM.activeDrag.fire('drag:exit', { drop: this });
                        delete DDM.otherDrops[this];
                        this.get(NODE).removeClass('dd-drop-over');
                    }
                }
            }
        },
        /**
        * @method toString
        * @description Simple toString method.
        * @return {String}
        */
        toString: function() {
            return 'Drop (#' + this.get(NODE).get('id') + ')';
        }
    });

    Y.DD.Drop = Drop;


}, '@VERSION@' ,{requires:['dd-ddm-drop'], skinnable:false});


YUI.add('dd-dragdrop-all', function(Y){}, '@VERSION@' ,{skinnable:false, use:['dd-ddm-base', 'dd-ddm', 'dd-ddm-drop', 'dd-drag', 'dd-proxy', 'dd-constrain', 'dd-plugin', 'dd-drop']});
