
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
    draggables: ['zurb-foundation-5.column']
  },
  'zurb-foundation-5.column': {
    label: 'Column',
    construct: function () {
      return $('<div class="column medium-6"></div>');
    },
    draggables: ['*']
  },
  'placeholdit.image': {
    label: 'Placehold.it Image',
    construct: function () {
      return $('<div><img src="http://placehold.it/200x150" /></div>');
    },
    draggables: ['*']
  }
};

var prototyper = {};

$(function () {

  var $body = $(document.body);


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


  var setupDroppable = function ($droppable) {

    var data = $droppable.data('component-data');

    console.log('setting up droppable', data);

      $droppable.droppable({
        greedy: true, // false
        accept: function ($draggable) {
          var draggableData = $draggable.data('component-control-data');
          var $droppable = $(this);
          var droppableData = $droppable.data('component-data');
          // console.log('$droppable', $droppable[0], droppableData);
          // console.log('$draggable', $draggable[0], draggableData);
          var any = _.any(droppableData.def.draggables, function (id) {
            var accept = id === '*' || draggableData.id === id;
            // console.log(droppableData.id, 'accepts', draggableData.id, '?', accept);
            return accept;
          });
          // console.log(any);
          return any;
        }
      });

      $droppable.on('dropover', function (e, ui) {
        e.stopPropagation();
        var $target = $(e.target);
        var data = $target.data('component-data');
        console.log('dropover data', data);
        $target.addClass('dropover');
      });

      $droppable.on('dropout', function (e, ui) {
        e.stopPropagation();
        $(e.target).removeClass('dropover');
      });

      $droppable.on('drop', function (e, ui) {
        e.stopPropagation();
        var $target = $(e.target);
        $target.removeClass('dropover');
        var componentId = ui.draggable.attr('data-component-control');
        var $component = createComponent(componentId);
        $target.append($component);
        update();
      });
  };


  var $rootContainer = $('.root-container');

  var $root = prototyper.root = createComponent('root');

  $rootContainer.append($root);


  $root.on('mouseenter', '*', function (e) {
    e.stopPropagation();
    $(e.target).addClass('hover');
  });

  $root.on('mouseleave', '*', function (e) {
    e.stopPropagation();
    $(e.target).removeClass('hover');
  });


  setupDroppable($root, {
    draggables: ['*']
  });


  var update = function () {
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
    var $target = $(e.target);
    // console.log('dragstart', $target[0]);
    var data = $target.data('component-control-data');
    $body.addClass('dragging');
  });

  $componentControls.on('drag', function (e, ui) {
    // console.log(e);
  });

  $componentControls.on('dragstop', function (e, ui) {
    $body.removeClass('dragging');
  });

  update();

});
