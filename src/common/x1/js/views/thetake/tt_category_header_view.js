/**
 * Created by Diana Fisher on 6/1/15.
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/thetake/TTCategoryHeaderView.html'
], function($, _, Backbone, InteractiveComp, template){

    return InteractiveComp.View.extend({

        className: 'section-title focusable',
        tagName: 'li',

        render: function () {
            
            // Build element instead of using a template..
            $(this.el).attr('data-position', this.model.position);
            $(this.el).attr('data-up-position', this.model.upPosition);
            $(this.el).attr('data-down-position', "2,0");
            $(this.el).attr('data-action', 'onCategory');
            $(this.el).attr('data-role', this.model.categoryId);
            $(this.el).text(this.model.categoryName);

            this.initFocusManager();
            return this;
        }
    })
});

