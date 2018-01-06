#!/bin/bash

path='img'

for file in `ls $path/`
do
    file_name=`basename $file` 
    
    #//获取后缀名
    file_suffix=${file_name##*.}
    #//转为小写
    typeset -l file_suffix
        case $file_suffix  in
	    webp)  ;;
            png|jpg|jpeg)
	    if [ -e $path/$file_name.webp ]
	    then
		 continue
	    else
  		echo `cwebp -q 75 $path/$file_name  -o $path/$file_name.webp`
	    fi
	     ;;
        esac

done



