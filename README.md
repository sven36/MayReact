# MayReact
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
                比如我在render过程中要设置css属性,要添加event监听事件,有ref要添加,有context要获取,针对vnode,component,
                statelessComponent,text,我要对应如何render;我这些过程将来我想引入插件该怎么设置钩子函数等;
                接下来要考虑生命周期了在首次render过程中有constructor,componentWillMount,render,componentDidMount;

                constructor:我如果在constructor调用setState应该怎么办(不推荐写法,但是我们要做兼容处理)我在constructor里面改变props了
                            应该怎么办
                
                componentWillMount:componentWillMount调用setState要合并state(不推荐,需兼容)我在componentWillMount调用了父组件的
                                    setState放到父组件下一生命周期(不推荐,需兼容)
                
                render,componentDidMount:同理都放到下一生命周期处理(无论是当前组件调用还是子组件调用);
                
                componentDidMount:如果该组件有ref回调函数,应当先调用componentDidMount回调在调用ref回调,而且componentDidMount
                                  应当是所有组件都render之后再顺序调用所有的componentDidMount;(如果setState传入了回调函数,
                                  该回调函数在最后统一触发);
                
                还有css属性注意property与attribute的区别,backgroundColor等要转换成background-color(同理各种Webkit,Moz等);
                event要注意一些特殊事件,focus,blur,wheel,change等;受控组件与非受控组件事件的区别等;
                render要注意类型是vnode,component,statelessComponent,text等对应不同的render方式,还要考虑我是多个component,多个                               statelessComponent嵌套怎么区分怎么render等;
    
    diff过程:
                和render的深度优先不同,render我是每层create一个容器dom,然后再render其children不断递归向下,然后再层层把children
                append到dom里面;
                但是diff是不同的,diff我已经具备当前的vnode和之前的prevVnode和已经render的dom,在diff的时候如果之前为null或
                之前的type与key和当前node不一样那我直接渲染新的vnode即可,如果type与key一样那么就需要diffProps了,这时候你或许会考虑
                我是一个一个children diff还是先分类再统一diff?移动节点我该怎么diff？textNode的diff比较频繁我是不是可以优化？
                diff过程中突然返回null或false该怎么办,受控组件diff之后变为非受控组件了该怎么办,等等等等;
                尤其要注意释放不再使用的vnode,这里容易内存泄漏;

                diff过程的生命周期有:componentWillReceiveProps,shouldComponentUpdate,componentWillUpdate,render,componentDidUpdate

                setState:
                    diff过程中的所有生命周期不论是当前组件setState还是调用父组件的setState都放到下一生命周期处理;
                    forceUpdate和setState流程很像不过foreUpdate会忽略shouldComponentUpdate事件,也就是说它会强制走完diff流程;
                    这部分难点基本上都在子组件调用父组件的setState,context穿透更新,ref回调,各种生命周期回调函数的执行顺序等;

    调度模块:
                再加上这部分我们的React基本上就全了,在写的过程中你肯定会发现我们有各种各样的回调,setState的回调,ref回调,生命周期回调,
                event回调等;
                我们diff的时候也需要一个脏组件队列方便我们排序然后顺序diff,diff过程中我还可能添加新的脏组件等等;
                这些我们很明显都需要队列来处理,这时候或许你会想我们要一个什么样的队列,我们是把回调函数单独一个队列到时候排序然后顺序执行呢,
                还是我把回调函数绑定在component上在遍历component的时候调用相应回调呢?


--------------------------------------------------------------------------------------------------------------------------------------
##介绍下MayReact；

　　https://github.com/sven36/MayReact

　　MayReact是我参照React，preact，anujs等库写的一个miniReact框架；其初衷和anu很相似就是写一个更小更快，不过可以拥有react的api完美兼容其生态的一个框架；
   anu我也很推荐地址：https://github.com/RubyLouvre/anu

　　今天我很高兴，因为MayReact已经可以跑通全部的React官方测试用例，也就是说MayReact已经可以使用在生产环境了；

　　当然现在MayReact还不够完美，还有很多可以雕琢的地方，不过0到1已经完成了1到2就会顺利很多；

　　其实我写MayReact的出发点就是看React的源码很多地方看不明白有些地方感觉React又有点过实现了，就想着自己写一个类似的框架吧；

　　MayReact其实May取maybe的意思，就是或许我也可以写一个React框架；

　　在这个过程中又看了preact,anu发现司徒正美先生的anu和我目的一样，而且人家写的很好，所以MayReact有很多地方都是借(chao)鉴(xi)anu和preact的，当然更多的地方是我一点点写出来的；

以后我的项目就打算替换成MayReact了，毕竟自己写的；而且跑400多单元测试这种苦不能白挨啊~

　　当然其实我写这个更主要的目的还是为了帮助很多像我一样的人，我开始就对React的源码感兴趣好奇他是怎么实现的，网上看各种源码分析自己看源码都看的似懂非懂；想自己写又不知从何写起；

后来在网上看见了peact，后来又找到了anu，看着不过瘾就开始自己写；开始到现在得有三个多月了吧，其实在这个过程中自己实现一个简易的React不难，难得是实现的React它的行为要和官方的

一样，比如我在WillMount和DidMount调用setState什么区别，我在子组件调用父组件的setState生命周期应该怎么走，我调了次setState，再调forceUpdate，再调setState它该怎么表现；

我这个组件是受控组件diff的时候变成非受控组件了该提示什么，我这个组件context被三个不同的子组件用到了，我在第一个组件修改了其它两个要不要修改怎么修改；（有没有感觉到我跑他这单元测试有多崩溃！！！）这三个多月其实完成最初版本的只用了半个月多点吧，剩余时间都在不停的跑测试不停的重构了；所以你写一个也肯定会对React了如指掌再看React的源码会微微一笑，当初不理解的地方原来是为了处理这种情况的；为啥会了如指掌？每天调试几百次坚持几个月不了如指掌才怪~当然我不是为了吓唬你这个多难，其实它并不难，更多的需要你的毅力，不停的思考更好的解决方法；而你写完之后也会有巨大的成就感的；借用我听到的一句话：做事情有两个最重要的品质一个是热情一个是毅力，热情让你开始，毅力让你坚持；

　　好了鸡汤说完了，再稍微说下MayReact，为了方便你看最容易看的版本（我理解写完未解耦的最容易看因为他的逻辑是顺着下来的，如果我把代码抽出更多的公共方法，改善它的流程那是因为我对它很了解我知道这段代码应该什么时候执行，该怎么执行所以我觉得我为什么光看看不太懂，因为我没有这个思考过程，写这个的目的是什么，要在哪调用，需要注意顺序吗，需要注意值是新的还是旧的吗等等；我新建了一个分支forRead这就是刚跑完测试的版本虽然有很多地方还很low不过应该是比较容易读的版本，好多地方也都写了当时的理解等等；希望对你有帮助；）

MayReact现在是65kb 大小跟anu(75kb)差不多，等我优化之后体积应该差不多吧，最后基本上是React的1/5了；性能刚跑了一下anu是React的两倍，我这才是React的一倍，等我优化之后争取比anu还快一些吧（毕竟珠玉在前，也要有点创新不是）；其实写完May我觉得性能重要但是框架的健壮性也是应该保证的，而且我重写一个框架让它更快还是比较简单的毕竟珠玉在前，难的是从无到有，当然这也是我们继续努力的方向；

　　絮絮叨叨说了这么多也希望你早日完成你的框架；路漫漫其修远兮，愿你我都能孜孜以求~

 
