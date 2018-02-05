写一下过程中的思索：React大概可以分为这几个模块：

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

    首次render:
                最重要的就是深度优先递归遍历了,难的地方在于我怎么把这个过程设计的高内聚低耦合,这样我能很方便的加一些或去掉一些处理流程
                比如我在render过程中要设置css属性,要添加event监听事件,有ref要添加,有context要获取,针对vnode,component,statelessComponent
                text,我要对应如何render;我这些过程将来我想引入插件该怎么设置钩子函数等;
                接下来要考虑生命周期了在首次render过程中有constructor,componentWillMount,render,componentDidMount;

                constructor:我如果在constructor调用setState应该怎么办(不推荐写法,但是我们要做兼容处理)我在constructor里面改变props了应该怎么办
                
                componentWillMount:componentWillMount调用setState要合并state(不推荐,需兼容)我在componentWillMount调用了父组件的setState放到父                                      组件下一生命周期(不推荐,需兼容)
                
                render,componentDidMount:同理都放到下一生命周期处理(无论是当前组件调用还是子组件调用);
                
                componentDidMount:如果该组件有ref回调函数,应当先调用componentDidMount回调在调用ref回调,而且componentDidMount应当是所有组件都                                        render之后再顺序调用所有的componentDidMount;(如果setState传入了回调函数,该回调函数在最后统一触发);
                
                还有css属性注意property与attribute的区别,backgroundColor等要转换成background-color(同理各种Webkit,Moz等);
                event要注意一些特殊事件,focus,blur,wheel,change等;受控组件与非受控组件事件的区别等;
                render要注意类型是vnode,component,statelessComponent,text等对应不同的render方式,还要考虑我是多个component,多个                               statelessComponent嵌套怎么区分怎么render等;
    
    diff过程:
                和render的深度优先不同,render我是每层create一个容器dom,然后再render其children不断递归向下,然后再层层把children append到dom里面;
                但是diff是不同的,diff我已经具备当前的vnode和之前的prevVnode和已经render的dom,在diff的时候如果之前为null或之前的type与key和当前                 node不一样那我直接渲染新的vnode即可,如果type与key一样那么就需要diffProps了,这时候你或许会考虑我是一个一个children diff还是先分类                 再统一diff?移动节点我该怎么diff？textNode的diff比较频繁我是不是可以优化？diff过程中突然返回null或false该怎么办,受控组件diff之后变                  为非受控组件了该怎么办,等等等等;
                尤其要注意释放不再使用的vnode,这里容易内存泄漏;

                diff过程的生命周期有:componentWillReceiveProps,shouldComponentUpdate,componentWillUpdate,render,componentDidUpdate

                setState:
                    diff过程中的所有生命周期不论是当前组件setState还是调用父组件的setState都放      到下一生命周期处理;
                    forceUpdate和setState流程很像不过foreUpdate会忽略shouldComponentUpdate事件,也就是说它会强制走完diff流程;
                    这部分难点基本上都在子组件调用父组件的setState,context穿透更新,ref回调,各种生命周期回调函数的执行顺序等;

    调度模块:
                再加上这部分我们的React基本上就全了,在写的过程中你肯定会发现我们有各种各样的回调,setState的回调,ref回调,生命周期回调,event回调等;
                我们diff的时候也需要一个脏组件队列方便我们排序然后顺序diff,diff过程中我还可能添加新的脏组件等等;
                这些我们很明显都需要队列来处理,这时候或许你会想我们要一个什么样的队列,我们是把回调函数单独一个队列到时候排序然后顺序执行呢,还是我把                 回调函数绑定在component上在遍历component的时候调用相应回调呢?



