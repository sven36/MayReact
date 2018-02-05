#React大概可以分为这几个模块：

    vnode模块：
                就是以js对象的形式表示dom,包括createElement,cloneElement,Component,PureComponent,statelessComponent

    render模块:
                最核心的模块了，包括首次render以及diff，这个过程中又使用到了
                props模块(给dom设置css属性)
                event模块(我们的合成事件抹平浏览器差异,统一绑定在document等)
                ref模块(如果有ref function或string应该在哪回调)
                context模块(context该怎样向下传递diff之后怎么区分新老context等)
                PropTypes模块(组件取context需要先判断类型)
                Children模块(提供操作children的方法)
                options模块(也可叫调度模块,因为我们不可避免使用到队列来处理diff或各种回调,以及一些插件如redux也需要一些钩子函数)
