// This version of the Movies App creates a 'movies' jQuery plugin

((window.$deferRun || function( run ){ run(); }) ( function( $, options ) {

$.movies = function( app ) {
	var genre="Cartoons", pageIndex = app.pageIndex || 1, pageSize = app.pageSize || 3, pageCount = 0, bookingTmplItems = [], selectedBooking;

	$.extend( app, {
		cartTmplItem: null,
		cart: { bookings: {}, count: 0, sortBy:0 },
		init: function() {
			$( "#genres li" ).click( movieApp.selectGenre );

			$( ".cart" )
				.delegate( "select", "change", app.sort )
				.delegate( "#sortBtn", "click", app.sort )
				.delegate( "#submit", "click", function() {
					alert( app.cart.count + " bookings submitted for payment...");
					movieApp.removeBookings();
				})
				.delegate( "#cancel", "click", function() {
					app.removeBookings();
				})
				.empty()
				.append( "#cartTmpl", app.cart );

			app.cartTmplItem = $( ".cart td" ).tmplItem();
			app.getMovies().done( app.showMovies );
		},
		selectGenre: function() {
			$( "#genres li" ).removeClass( "selected" );
			$( this ).addClass( "selected" );

			pageIndex = 1;
			genre = encodeURI( $(this).text() );
			app.getMovies( pageIndex ).done( app.showMovies );
		},
		sort: function() {
			var compare = compareName, reverse = false, data = [];
			app.cart.sortBy = $( "#sort select" ).val();
			switch ( $( "#sort select" ).val() ) {
				case "1":
					reverse = true;
					break;
				case "2":
					compare = compareDate;
					break;
			}

			for ( var item in app.cart.bookings ) {
				data.push( app.cart.bookings[item] );
			}
			data = data.sort( compare );

			bookingTmplItems = $.tmplCmd( "replace", data, bookingTmplItems );

			function compareName( a, b ) {
				return a == b ? 0 : (((a.movie.Name > b.movie.Name) !== reverse) ? 1 : -1);
			}
			function compareDate( a, b ) {
				return a.date - b.date;
			}
		},
		getMovies: function( index ) {
			index = index || 1;
			var query = "http://odata.netflix.com/Catalog/Genres('" + genre + "')/Titles" +
				"?$format=json" +
				"&$inlinecount=allpages" +				// get total number of records
				"&$skip=" + (index-1) * pageSize +		// skip to first record of page
				"&$top=" + pageSize;					// page size

			pageIndex = index;

			return $.ajax({
				dataType: "jsonp",
				url: query,
				jsonp: "$callback"
			});
		},
		showMovies: function( data ) {
			pageCount = Math.ceil( data.d.__count/pageSize ),
				movies = data.d.results;

			$( "#pager" ).pager({ pagenumber: pageIndex, pagecount: pageCount, buttonClickCallback: app.getMoreMovies });

			$( "#movieList" )
				.empty()

				// Render movies using the movieTemplate, and display rendered movies in the movieList container
				.append( "#movieTmpl", movies, { rendered: app.onMovieRendered } );
		},
		getMoreMovies: function( index ) {
			app.getMovies( index ).done( app.showMovies );
		},
		buyTickets: function( movie ) {
			// Add item to cart
			var booking = app.cart.bookings[movie.Id];
			if ( booking ) {
				booking.quantity++;
			} else {
				app.cart.count++;
				app.cartTmplItem.update();
				booking = { movie: movie, date: new Date(), quantity: 1, movieTheater: "" };
			}
			app.selectBooking( booking );
		},
		selectBooking: function( booking ) {
			if ( selectedBooking ) {
				if ( selectedBooking === booking ) {
					app.updateBooking( app.bookingItem( selectedBooking ));
					return;
				}
				// Collapse previously selected booking, and switch to non-edit view
				var oldSelected = selectedBooking;
				$( "div", app.bookingItem( oldSelected ).nodes ).animate( { height: 0 }, 500, function() {
					app.switchView( oldSelected );
				});
			}
			selectedBooking = booking;
			if ( !booking ) {
				return;
			}
			if ( app.cart.bookings[booking.movie.Id] ) {
				app.switchView( booking, true );
			} else {
				app.cart.bookings[booking.movie.Id] = booking;

				// Render the booking for the chosen movie using the bookingEditTemplate, and append the rendered booking to the bookings list
				$( "#bookingsList" ).append( "#bookingEditTmpl", booking, {
					animate: true,
					rendered: app.onBookingEditRendered,
					addedTmplItems: bookingTmplItems
				});
			}
		},
		switchView: function( booking, edit ) {
			if ( !booking ) {
				return;
			}
			var item = app.bookingItem( booking ),
				rendered = edit ? app.onBookingEditRendered  : app.onBookingRendered;
			if ( item.rendered !== rendered) {
				item.tmpl = $( edit ? "#bookingEditTmpl" : "#bookingTitleTmpl" ).template();
				item.rendered = rendered;
				item.update();
			}
		},
		onMovieRendered: function( item ) {
			$( ".buyButton", item.nodes ).click( function() {
				app.buyTickets( item.data );
			});
		},
		onBookingRendered: function( item ) {
			$( item.nodes ).click( function() {
				app.selectBooking( item.data );
			});
			$( ".close", item.nodes ).click( app.removeBooking );
		},
		onBookingEditRendered: function( item ) {
			var data = item.data, nodes = item.nodes;

			$( nodes[0] ).click( function() {
				app.selectBooking();
			});

			$( ".close", nodes ).click( app.removeBooking );

			$( ".date", nodes ).change( function() {
				data.date = $(this).datepicker( "getDate" );
				app.updateBooking( item );
			})
			.datepicker({ dateFormat: "DD, d MM, yy" });

			$( ".quantity", nodes ).change( function() {
				data.quantity = $(this).val();
				app.updateBooking( item );
			});

			$( ".theater", nodes ).change( function() {
				data.movieTheater = $(this).val();
				app.updateBooking( item );
			});

			if ( item.animate ) {
				$( "div", nodes ).css( "height", 0 ).animate( { height: 116 }, 500 );
			}
		},
		updateBooking: function( item ) {
			item.animate = false;
			item.update();
			item.animate = true;
		},
		removeBooking: function() {
			var booking = $.tmplItem(this).data;
			if ( booking === selectedBooking ) {
				selectedBooking = null;
			}
			delete app.cart.bookings[booking.movie.Id];
			app.cart.count--;
			app.cartTmplItem.update();
			$.tmplCmd( "remove", booking, bookingTmplItems );
			return false;
		},
		removeBookings: function() {
			$.tmplCmd( "remove", bookingTmplItems );
			bookingTmplItems = [];
			app.cart.count = 0;
			app.cart.bookings = {};
			selectedBooking = null;
			app.cartTmplItem.update();
		},
		formatDate: function( date ) {
			return date.toLocaleDateString();
		},
		bookingItem: function( booking ) {
			return $.tmplCmd( "find", booking, bookingTmplItems)[0];
		}});

		app.init();
	};


}));