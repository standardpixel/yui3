YUI.add("dd-plugin",function(B){B.Plugin=B.Plugin||{};var A=function(C){C.node=C.owner;A.superclass.constructor.apply(this,arguments);};A.NAME="dd-plugin";A.NS="dd";B.extend(A,B.DD.Drag);B.Plugin.Drag=A;},"@VERSION@",{skinnable:false,requires:["dd-drag"],optional:["dd-constrain","dd-proxy"]});