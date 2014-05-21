App = Ember.Application.create();

// Handlebars helper to do string highlighting.
Ember.Handlebars.helper('highlight', function(str, start, end, options) {
  if (start >= 0 && end > 0) {
    var left, middle, right;
    left = (start > 0) ? str.slice(0, start) : '';
    middle = str.slice(start, end);
    right = str.slice(end)
    return new Handlebars.SafeString(left + '<em>' + middle + '</em>' + right);
  }
  else {
    return str;
  }
});

App.Album = Ember.Object.extend({
  title: '',
  imgUrl: '',
  artist: null
});

App.Artist = Ember.Object.extend({
  name: '',
  imgUrl: '',
  butt: ''
});

var sample_artists = [
  App.Artist.create({
    name: 'Kent',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/97759403/Kent+2014fEmilFagander_02500x33.jpg'
  }),
  App.Artist.create({
    name: 'Sólstafir',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/52647109/Slstafir.png'
  }),
  App.Artist.create({
    name: 'The Verve',
    imgUrl: 'http://userserve-ak.last.fm/serve/_/402611/The+Verve.jpg'
  }),
  App.Artist.create({
    name: 'Camera Obscura',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/60543725/Camera+Obscura+PNG.png'
  }),
  App.Artist.create({
    name: 'Spiritualized',
    imgUrl: 'http://userserve-ak.last.fm/serve/_/150972/Spiritualized.jpg'
  }),
  App.Artist.create({
    name: 'Thrawsunblat',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/87697953/Thrawsunblat+joelviolette.jpg'
  }),
  App.Artist.create({
    name: 'The Jam',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/29887139/The+Jam+all+mod+cons.jpg'
  }),
  App.Artist.create({
    name: 'M83',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/71481450/M83+3.png'
  }),
  App.Artist.create({
    name: 'Krallice',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/61806689/Krallice.png'
  }),
  App.Artist.create({
    name: 'Hakan Hellstrom',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/52943513/Hkan+Hellstrm++Andreas+hlund.jpg'
  }),
  App.Artist.create({
    name: 'Ulver',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/67319746/Ulver++PNG.png'
  }),
  App.Artist.create({
    name: 'Slowdive',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/96464657/Slowdive++better+miniature+prof.jpg'
  }),
  App.Artist.create({
    name: 'Hevisaurus',
    imgUrl: 'http://userserve-ak.last.fm/serve/500/36679583/Hevisaurus+3540292784_photo.jpg'
  })
];

var sample_album = App.Album.create({
  title: 'Sound Affects',
  artist: sample_artists[6]
});

App.IndexRoute = Ember.Route.extend({
  model: function() {
    // mock retrieving our sample album as the model
    return sample_album;
  }
});

App.IndexController = Ember.Controller.extend({
  artists: function() {
    // make available our list of artists to choose from
    return sample_artists;
  }.property()
})

/**
  ItemPickerComponent implements a basic selection picker with searching/highlighting.

  This default demo implementation only performs simple filtering against a list 
  of existing objects, but this could be easily modified to search against a webservice.

  ## Properties
  - items: the list of items to choose from

  - selected: The currently selected item. This is a binding that will be 
      updated when the picker's selection changes.

  - propertyName (optional): the property name of the objects that will be used
    for display in listings, etc. If left blank, the picker will print the 
    object itself.

  - placeholder (optional): The placeholder text when nothing is selected
*/

App.ItemPickerComponent = Ember.Component.extend({
  query: '',
  classNames: ['item-picker'],
  propertyName: '',
  _displayedResults: [],
  placeholder: 'Please make a selection.',

  // after component is ready, pre-populate the default listing
  didInsertElement: function() {
    this.fire();
  },

  hasSelection: function() {
    var property = this.get('selectedWithProperty');
    return (property !== undefined && property !== null);
  }.property('selectedWithProperty'),

  selectedWithProperty: function() {
    return this.getWithDefault('selected.' + this.get('propertyName'), this.get('selected'));
  }.property('selected'),

  // Debounced observer. Watches for query changes, but will only act on them every 300ms.
  queryChanged: function() {
    Ember.run.debounce(this, this.fire, 300);
  }.observes('query'),

  fire: function() {
    var query = this.get('query');
    results = [];
    var propertyName = this.get('propertyName');

    if (query.length > 0) { 
      query = ' ' + query.toUpperCase().trim();
      this.get('items').forEach(function(item, index) {
        var match_str = ' ' + item.getWithDefault(propertyName, item).toUpperCase();
        var pos = match_str.indexOf(query);
        if (pos !== -1) {
          var newResult = {
            display: item.getWithDefault(propertyName, item),
            data: item,
            start: pos,
            end: (pos + query.length - 1)
          };
          results.push(newResult);
        }
      });
    }
    else {
      this.get('items').forEach(function(item, index) {
        results.push({
          display: item.getWithDefault(propertyName, item),
          data: item,
          start: -1,
          end: -1
        });
      });
    }
    this.set('_displayedResults', results);
  },

  activate: function() {
    if (this.get('active') !== true) {
      var eventNamespace = 'click.' + Ember.guidFor(this);
      var self = this;
      var container = this.$();

      // bind event handler to entire document to check for clicks outside component.
      $(document).on(eventNamespace, function(e) {
        if (!container.is(e.target) && container.has(e.target).length === 0) {
          self.deactivate();
        }
        return false;
      });

      this.get('collectionView').bindKeyboardEvents();
      this.set('active', true);
      this.$('#dropdown-body').show();
      this.$('#dropdown-query-input').focus();
    }
  },

  deactivate: function() {
    if (this.get('active') !== false) {
      this.set('query', '');
      var eventNamespace = 'click.' + Ember.guidFor(this);
      $(document).off(eventNamespace);
      this.get('collectionView').unbindKeyboardEvents();
      this.$('#dropdown-body').hide();
      this.set('active', false);
    }
  },

  actions: {
    toggle: function() {
      if (this.get('active')) { this.deactivate(); }
      else { this.activate(); }
    },
    pick: function(item) {
      this.set('selected', item);
      this.deactivate();
    }
  }

});

/**
  Default Item View for SelectableCollectionView
  This must be declared before SelectableCollectionView in current Ember (1.5)
*/
App.SelectableCollectionItemView = Ember.View.extend({

  classNames: 'dropdown-result',
  classNameBindings: ['isHighlighted'],
  isHighlighted: false,
  templateName: 'views/item-result',

  mouseEnter: function() {
    this.get('parentView').send('childMouseEnter', this.get('contentIndex'));
  },

  click: function() {
    this.get('controller').send('pick', this.get('content.data'));
  }

});

/**
  SelectableCollectionView implements a basic selectable list view with optional 
  highlighting. It is implemented as an Ember CollectionView. Handling selection 
  is assumed to be left to the item view.

  ## Formatting & Selection
  The list expects an array of objects in this format, placed in the content property:

  ```javascript
  {
    // the underlying JS object
    data: {name: "Example Object, can be in any format"}
    // the string to display in the list
    display: "My Example Object",
    // index position of where to start highlighting
    start: 0,
    // index position of where to end highlighting
    end: 1
  }
  ```

  Optionally you may provide a selected item in the 'selected' 
  property to pre-select an item in the collection.

  ## Handling keyboard events
  Call bindKeyboardEvents to start handling keyboard events. 
  This will bind an event handler on the document to intercept:
    - up key
    - down key
    - enter key

  Call unbindKeyboardEvents to stop.

*/

App.SelectableCollectionView = Ember.CollectionView.extend({

  tagName: "ul",
  itemViewClass: App.SelectableCollectionItemView,

  emptyView: Ember.View.extend({
    classNames: ['no-results'],
    template: Ember.Handlebars.compile("No results found.")
  }),

  init: function() {
    this._super();
    Ember.run.scheduleOnce('afterRender', this, 'highlightSelected');
  },

  actions: {
    childMouseEnter: function(index) {
      this.set('_highlightedIndex', index);
    }
  },

  arrayDidChange: function(content, start, removed, added) {
    this._super(content, start, removed, added);
    Ember.run.scheduleOnce('afterRender', this, 'highlightSelected');
  },

  bindKeyboardEvents: function() {
    var keyNamespace = 'keydown.' + Ember.guidFor(this);
    var self = this;

    // bind keyboard events
    $(document).on(keyNamespace, function(e) {
      if (e.which === 38) {
        self.decrementCursor();
      }
      else if (e.which === 40) {
        self.incrementCursor();
      }
      else if (e.which === 13) {
        var index = self.get('_highlightedIndex');
        var childView = self.get('childViews')[index];
        childView.click();
      }
      else {
        return;
      }
      // disable pointer events on list until mouse is moved
      // this prevents hover from firing during keyboard scrolling in chrome/FF.
      // IE11 already handles this properly.
      var pointerEvents = self.$().css('pointer-events');
      if (pointerEvents !== 'none') {
        $(document).on('mousemove', function(e) {
          self.$().css('pointer-events', 'auto');
          $(document).off('mousemove');
        });
        self.$().css('pointer-events', 'none');
      }
    });
  },

  unbindKeyboardEvents: function() {
    var keyNamespace = 'keydown.' + Ember.guidFor(this);
    // unbind keyboard events
    $(document).off(keyNamespace);
  },

  highlightSelected: function() {
    var obj = this.get('selected'),
        self = this,
        found = false,
        oldIndex = this.get('_highlightedIndex');

    this.get('childViews').forEach(function(view, index) {
      if (view.get('content.data') === obj) {
        self.set('_highlightedIndex', view.get('contentIndex'));
        found = true;
      }
    });
    if (found == false) {
      this.set('_highlightedIndex', 0);
    }
    // manually force a re-render if the highlighted index did not change.
    if (oldIndex == this.get('_highlightedIndex')) {
      this.highlightChanged();
    }
  },

  incrementCursor: function() {
    var length = this.get('content').length;
    var index = this.get('_highlightedIndex');
    if (index < length - 1) {
      this.incrementProperty('_highlightedIndex');
    }
    else {
      this.set('_highlightedIndex', 0);
    }
  },

  decrementCursor: function() {
    var length = this.get('content').length;
    var index = this.get('_highlightedIndex');
    if (index > 0) {
      this.decrementProperty('_highlightedIndex');
    }
    else {
      this.set('_highlightedIndex', length - 1);
    }
  },

  // before the highlight changes, remove the highlight property on the currently highlighted item.
  highlightWillChange: function() {
    var index = this.get('_highlightedIndex');
    if (index !== undefined) {
      var view = this.get('childViews')[index];
      if (view !== undefined) {
        view.set('isHighlighted', false);
      }
    }
  }.observesBefore('_highlightedIndex'),

  highlightChanged: function() {
    var index = this.get('_highlightedIndex'),
        views = this.get('childViews');

    if ((views.length > 0) && views[index] !== undefined) {
      var view = views[index];

      // upper and lower coords of the <ul> tag the list is contained in
      var viewportTop = this.$().scrollTop();
      var viewportBottom = viewportTop + this.$().height();

      // upper and lower coords of the highlighted child view
      var viewTop = viewportTop + view.$().position().top;
      var viewBottom = viewTop + view.$().outerHeight();

      // Determine if selected item is outside of current view's viewport.
      // if view above viewport, scroll so that top of view is aligned at top of container
      if (viewportTop > viewTop) {
        this.$().scrollTop(viewTop);
      }
      // if view below viewport, scroll so that bottom of view is aligned at bottom of container
      else if (viewBottom > viewportBottom) {
        this.$().scrollTop(viewBottom - this.$().height());
      }

      views[index].set('isHighlighted', true);
    }
  }.observes('_highlightedIndex')

});