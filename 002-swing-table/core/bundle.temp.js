(function() {
    /**
     * 定义组件
     * @param options
     */
    function defineComponent(options) {
        if (!options || !options.name) return;
        const name = options.name;
        delete options.name;
        const style = options.style;
        if (style) {
            const styleEl = document.createElement('style');
            const styleText = style.split('</style>')[0].split('<style>')[1];
            if (styleText) {
                styleEl.innerHTML = styleText;
                document.head.appendChild(styleEl);
            }
            delete options.style;
        }
        Vue.component(name, options);
    }


    /* content */

})();