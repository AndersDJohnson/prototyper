

var componentDefs = {
  'root': {
    hidden: true,
    construct: function () {
      return $('<div></div>');
    },
    draggables: ['*']
  },
  'zurb-foundation-5.row': {
    label: 'Row',
    construct: function () {
      return $('<div class="row"></div>');
    },
    draggables: ['zurb-foundation-5.column'],
    droppables: ['*']
  },
  'zurb-foundation-5.column': {
    label: 'Column',
    construct: function () {
      return $('<div class="column medium-6"></div>');
    },
    draggables: ['*'],
    droppables: ['zurb-foundation-5.row']
  },
  'placeholdit.image': {
    label: 'Placehold.it Image',
    construct: function () {
      return $('<div class="placeholdit-image"><img src="http://placehold.it/100x75" /></div>');
    },
    draggables: [],
    droppables: ['*']
  },
  'placeholdit.image.2': {
    label: 'Placehold.it Image 2',
    construct: function () {
      return $('<div class="placeholdit-image"><img src="http://placehold.it/50x50" /></div>');
    },
    draggables: [],
    droppables: ['*']
  }
};


var prototyper = {};


$(function () {


  var $body = $(document.body);

  var dragging = false;


  var createComponent = function (id) {
    var componentDef = componentDefs[id];
    var $component = componentDef.construct();
    $component.attr('data-component', id);
    $component.data('component-data', {
      id: id,
      def: componentDef
    });
    return $component;
  };


  var accept = function ($draggable, $droppable) {
    var draggableData = $draggable.data('component-control-data');
    var droppableData = $droppable.data('component-data');
    // console.log('$droppable', $droppable[0], droppableData);
    // console.log('$draggable', $draggable[0], draggableData);
    var draggables = droppableData.def.draggables || [];
    var droppables = draggableData.def.droppables || [];
    var allowDrag = _.any(draggables, function (id) {
      var accept = id === '*' || draggableData.id === id;
      // console.log(droppableData.id, 'drags', draggableData.id, '?', accept);
      return accept;
    });
    var allowDrop = _.any(droppables, function (id) {
      var accept = id === '*' || droppableData.id === id;
      // console.log(draggableData.id, 'drops', droppableData.id, '?', accept);
      return accept;
    });
    return allowDrag && allowDrop;
  };


  var setupDroppable = function ($droppable) {

    var data = $droppable.data('component-data');

    // console.log('setting up droppable', data);

    $droppable.droppable({
      greedy: true, // false
      accept: function ($draggable) {
        var $droppable = $(this);
        return accept($draggable, $droppable);
      }
    });

    $droppable.on('drop', function (e, ui) {
      e.stopPropagation();
      var $target = $(e.target);
      $target.removeClass('dropover');
      var componentId = ui.draggable.attr('data-component-control');
      var $component = createComponent(componentId);

      if ($target.is($dropAround)) {
        if (dropStrategy === 'before') {
          $dropAround.prepend($component);
        }
        else if (dropStrategy === 'after') {
          $dropAround.append($component);
        }
        else {
          throw new Error('unknown drop strategy "' + dropStrategy + '"');
        }
      }
      else {
        if (dropStrategy === 'before') {
          $dropAround.before($component);
        }
        else if (dropStrategy === 'after') {
          $dropAround.after($component);
        }
        else {
          throw new Error('unknown drop strategy "' + dropStrategy + '"');
        }
      }

      updateComponents();
      // drawBoxes();
    });


  };


  var $draggable;

  var $dropInto;
  var $dropAround;
  var dropStrategy;


  var $highlightedBox;
  var $highlightedElement;


  var setHighlightedBox = function ($newHighlightedElement) {

    if ($newHighlightedElement.is($highlightedElement)) {
      return false;
    }

    $highlightedElement = $newHighlightedElement;

    if ($highlightedBox) {
      unsetHighlightedBox();
    }

    // console.log('setHighlightedBox', $droppable[0]);

    var $box = $('<div class="highlighted-box"></div>');
    $highlightedBox = $box;
    $box.hide(); 
    $rootContainer.append($box);
    drawHighlightedBox();
    $box.show();
  };


  var drawHighlightedBox = function () {

    if ($highlightedBox && $highlightedElement) {

      var rootOffset = $root.offset();
      var highlightedElementOffset = $highlightedElement.offset();
      var relativeOffset = {
        top: highlightedElementOffset.top - rootOffset.top,
        left: highlightedElementOffset.left - rootOffset.left
      };
      // console.log(relativeOffset.top, relativeOffset.left);
      var width = $highlightedElement.outerWidth();
      var height = $highlightedElement.outerHeight();

      $highlightedBox.css({
        left: relativeOffset.left,
        top: relativeOffset.top,
        width: width,
        height: height
      });

    }

  };


  var drawBoxes = function () {
    drawHighlightedBox();
  };


  var unsetHighlightedBox = function () {
    if ($highlightedBox) {
      $highlightedBox.remove();
    }
  };


  var $rootContainer = $('.root-container');

  var $root = prototyper.root = createComponent('root');

  $rootContainer.append($root);


  $root.on('scroll', function (e) {
    drawBoxes();
  });


  // $rootContainer.on('mousemove', function (e) {
  $rootContainer.on('mousemove', '[data-component]', function (e) {
    var $target = $(e.target);
    if ($target.is('[data-component]')) {

      $dropInto = $target;

      if (! $dropInto) {
        return;
      }

      if (dragging && $draggable) {
        if (accept($draggable, $dropInto)) {
          setHighlightedBox($dropInto);
        }
      }

    }

    var $closestComponent = $target.closest('[data-component]');
    if ($closestComponent.length) {

      if (! dragging) {
        setHighlightedBox($closestComponent);
      }
      else {

        $dropAround = $closestComponent;

        var offset = $closestComponent.offset();
        var width = $closestComponent.outerWidth();
        var height = $closestComponent.outerHeight();
        var left = offset.left;
        var top = offset.top;
        var right = offset.left + width;
        var bottom = offset.top + height;
        var centerX = left + (width / 2);
        var centerY = top + (height / 2);
        var beforeX = e.pageX < centerX;
        var beforeY = e.pageY < centerY;
        // console.log([e.pageX, e.pageY],[left, top],[right, bottom]);
        // console.log('before x', beforeX, 'y', beforeY);

        var displayCSS = $closestComponent.css('display');
        var floatCSS = $closestComponent.css('float');
        // console.log(displayCSS, floatCSS);

        var isInlineDisplay = function (css) {
          return css === 'inline-block' || css === 'inline';
        };
        var isFloated = function (css) {
          return css !== 'none';
        };

        if (isInlineDisplay(displayCSS) || isFloated(floatCSS)) {
          if (beforeX) {
            dropStrategy = 'before';
          }
          else {
            dropStrategy = 'after';
          }
        }
        else {
          if (beforeY) {
            dropStrategy = 'before';
          }
          else {
            dropStrategy = 'after';
          }
        }
        console.log('$dropAround', $dropAround[0]);
        console.log('dropStrategy', dropStrategy);

        // console.log('$dropAround', $dropAround[0]);
      }
    }

    // closest...?

  });


  setupDroppable($root, {
    draggables: ['*']
  });


  var updateComponents = function () {

    var $droppables = $root.find('[data-component]');

    $droppables.each(function (i, el) {
      var $droppable = $(el);

      if ($droppable.data('ui-droppable')) {
        return;
      }

      var componentData = $droppable.data('component-data');
      var componentDef = componentData.def;

      setupDroppable($droppable);
    });

  };


  var $componentControlContainer = $('.component-control-container');


  $.each(componentDefs, function (id, def) {

    if (def.hidden) {
      return;
    }

    var $control = $('<div></div>');
    $control.attr('data-component-control', id);
    $control.text(def.label);

    $componentControlContainer.append($control);

    var $draggableHelper = $('<div class="draggable-helper"><div class="crosshairs">x</div></div>');

    $control.data('component-control-data', {
      id: id,
      def: def
    });

    $control.draggable({
      helper: function () {
        return $draggableHelper;
      },
      cursorAt: {
        top: 0,
        left: 0
      }
    })
  });


  var $componentControls = $componentControlContainer.find('[data-component-control]');


  $componentControls.on('dragstart', function (e, ui) {
    dragging = true;
    var $target = $(e.target);
    $draggable = $target;
    // console.log('dragstart', $draggable[0]);
    var data = $draggable.data('component-control-data');
    $body.addClass('dragging');
    drawBoxes();
  });

  $componentControls.on('drag', function (e, ui) {
    // console.log(e);
  });

  $componentControls.on('dragstop', function (e, ui) {
    dragging = false;
    $body.removeClass('dragging');
    console.log('dragstop');
    drawBoxes();
  });


  updateComponents();

});
