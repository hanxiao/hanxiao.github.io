document.addEventListener("DOMContentLoaded",function(){let e=new URL(document.location).searchParams.get("highlight");var n=document.querySelector(e);if(null!=e){var o=new window.Highlighter({scroll:!0,scrollDuration:500,color:"#4fc08d"});o.point(n),o.underline()}});