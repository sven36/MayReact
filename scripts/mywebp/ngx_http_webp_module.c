#include <ngx_config.h>  
#include <ngx_core.h>  
#include <ngx_event.h>  
#include <ngx_http.h>  
//   ./configure --add-module=/work/sv/env/nginx/nginx-1.6.2/src/mywebp
//   /usr/local/nginx/sbin/nginx -s reload -c /usr/local/nginx/conf/nginx.conf
//   /usr/local/nginx/sbin/nginx  -c /usr/local/nginx/conf/nginx.conf
//   /usr/local/nginx/sbin/nginx -s stop
//   vi /usr/local/nginx/conf/nginx.conf
//    cat /usr/local/nginx/conf/nginx.conf
//   可参考 http://blog.csdn.net/lclwjl/article/details/68921563 以及 深入理解ngixn(陶辉著)

static ngx_int_t ngx_http_webp_handler(ngx_http_request_t *r)  
{  
    //必须时GET或者HEAD方法，否则返回405 Not Allowed  
    if (!(r->method & (NGX_HTTP_GET|NGX_HTTP_HEAD)))  
        return NGX_HTTP_NOT_ALLOWED;  

    // ngx_table_elt_t *accept=r->headers_in.accept;
    // char *p= strstr(accept.value.data,"image/webp");    
    //丢弃请求中的包体 
    ngx_int_t rc = ngx_http_discard_request_body(r);  
    if (rc != NGX_OK)  
            return rc;  
    //设置返回的Content_Type。注意，ngx_str_t有一个很方便的初始化宏ngx_string,它可以把ngx_str_t的data和len成员都设置好
    ngx_str_t type = ngx_string("text/plain");  
    ngx_str_t response = ngx_string("Hello World!");  
  
    r->headers_out.status = NGX_HTTP_OK;  
    r->headers_out.content_length_n = response.len;  
    r->headers_out.content_type = type;  
    //发送HTTP头部  
    rc = ngx_http_send_header(r);  
    if (rc == NGX_ERROR || rc > NGX_OK || r->header_only)  
            return rc;  
    //构造ngx_buf_t结构体准备发送包体  
    ngx_buf_t *b = ngx_create_temp_buf(r->pool, response.len);  
    if (b == NULL)  
        return NGX_HTTP_INTERNAL_SERVER_ERROR;  
  
    ngx_memcpy(b->pos, response.data, response.len);  
    b->last = b->pos + response.len;  
    b->last_buf = 1;  
  
    ngx_chain_t out;  
    out.buf = b;  
    out.next = NULL;  
  
    return ngx_http_output_filter(r, &out);  
}  
  
static char* ngx_http_mywebp(ngx_conf_t *cf, ngx_command_t *cmd, void *conf)  
{  
    ngx_http_core_loc_conf_t *clcf;  
  
    clcf = ngx_http_conf_get_module_loc_conf(cf, ngx_http_core_module);  
  
    clcf->handler = ngx_http_webp_handler;  
      
    return NGX_CONF_OK;  
}  
  
static ngx_command_t ngx_http_mywebp_commands[] = {  
    {  
        ngx_string("mywebp"),  
        NGX_HTTP_MAIN_CONF | NGX_HTTP_SRV_CONF | NGX_HTTP_LOC_CONF | NGX_HTTP_LMT_CONF | NGX_CONF_NOARGS,  
        ngx_http_mywebp,  
        NGX_HTTP_LOC_CONF_OFFSET,  
        0,  
        NULL  
    },  
    ngx_null_command  
};  
  
static ngx_http_module_t ngx_http_webp_module_ctx = {  
    NULL,  
    NULL,  
    NULL,  
    NULL,  
    NULL,  
    NULL,  
    NULL,  
    NULL,     
};  
  
ngx_module_t ngx_http_webp_module = {  
    NGX_MODULE_V1,  
    &ngx_http_webp_module_ctx,  
    ngx_http_mywebp_commands,  
    NGX_HTTP_MODULE,  
    NULL,  
    NULL,  
    NULL,  
    NULL,  
    NULL,  
    NULL,  
    NULL,  
    NGX_MODULE_V1_PADDING  
};  