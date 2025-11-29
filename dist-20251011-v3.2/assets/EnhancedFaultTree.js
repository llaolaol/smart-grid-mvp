import{bi as me,c as Y,b as $,e as w,f as p,H as I,F as R,C as L,h as ge,D as F,n as ce,d as je,r as W,X as le,w as qe,o as Qe,aJ as Ue,i as fe,t as c,ah as b,q as d,B as re,u as K,an as Ze,am as Ke,bf as Je,aA as et,S as tt,V as ot,p as O}from"./index.js";import{ai as Q}from"./index4.js";const nt={viewBox:"0 0 80 100",class:"door-gate-svg"},at=["id"],it=["fill","stroke","filter"],st=["fill","stroke","filter"],lt=["fill","stroke","filter"],rt=["fill","stroke","filter"],ct=["fill"],dt={key:0,class:"state-text"},ht={__name:"LogicGateIcon",props:{gateType:{type:String,required:!0},state:{type:String,default:"unknown"},size:{type:String,default:"medium"},showStateText:{type:Boolean,default:!1},interactive:{type:Boolean,default:!0}},emits:["click"],setup(C,{emit:e}){const o=C,t=e,n=Y(()=>({...{small:{width:"150px",height:"180px"},medium:{width:"180px",height:"220px"},large:{width:"220px",height:"270px"}}[o.size],cursor:o.interactive?"pointer":"default"})),a=Y(()=>({true:"#67C23A",false:"#F56C6C",unknown:"#909399"})[o.state]),i=Y(()=>({true:"#529B2E",false:"#C45656",unknown:"#73767A"})[o.state]),r=Y(()=>(o.state==="unknown","#FFFFFF")),h=Y(()=>({true:"真",false:"假",unknown:"未知"})[o.state]),u=()=>{o.interactive&&t("click",o.gateType,o.state)};return(g,x)=>(w(),$("div",{class:ge(["logic-gate-icon",`gate-${C.gateType.toLowerCase()}`]),style:ce(n.value),onClick:u},[(w(),$("svg",nt,[p("defs",null,[p("filter",{id:`shadow-${C.gateType}`},[...x[0]||(x[0]=[p("feDropShadow",{dx:"2",dy:"4",stdDeviation:"3","flood-opacity":"0.3"},null,-1)])],8,at)]),C.gateType==="OR"?(w(),$("path",{key:0,d:"M40 25 L60 45 L60 75 Q40 60 20 75 L20 45 Z",fill:a.value,stroke:i.value,"stroke-width":"2",filter:`url(#shadow-${C.gateType})`},null,8,it)):C.gateType==="AND"?(w(),$("path",{key:1,d:"M20 75 L60 75 L60 45 Q60 25 40 25 Q20 25 20 45 Z",fill:a.value,stroke:i.value,"stroke-width":"2",filter:`url(#shadow-${C.gateType})`},null,8,st)):C.gateType==="NOT"?(w(),$("path",{key:2,d:"M20 85 Q10 95 40 95 Q70 95 60 85 L65 45 L40 10 L15 45 Z",fill:a.value,stroke:i.value,"stroke-width":"2",filter:`url(#shadow-${C.gateType})`},null,8,lt)):(w(),$("path",{key:3,d:"M10 90 L70 90 L70 30 Q70 10 40 10 Q10 10 10 30 Z",fill:a.value,stroke:i.value,"stroke-width":"2",filter:`url(#shadow-${C.gateType})`},null,8,rt)),p("text",{x:"40",y:"54","text-anchor":"middle","dominant-baseline":"central",fill:r.value,"font-size":"24","font-weight":"bold"},[C.gateType==="AND"?(w(),$(R,{key:0},[L("&")],64)):C.gateType==="OR"?(w(),$(R,{key:1},[L("∨")],64)):C.gateType==="NOT"?(w(),$(R,{key:2},[L("¬")],64)):(w(),$(R,{key:3},[L("?")],64))],8,ct)])),p("div",{class:ge(["state-indicator",`state-${C.state}`])},[...x[1]||(x[1]=[p("div",{class:"state-dot"},null,-1)])],2),C.showStateText?(w(),$("div",dt,F(h.value),1)):I("",!0)],6))}},ut=me(ht,[["__scopeId","data-v-b1b61eb4"]]);class pt{config={nodeWidth:160,nodeHeight:120,horizontalSpacing:550,verticalSpacing:320,levelHeight:350};positions=new Map;connections=[];adjustConfigForViewport(){const e=window.innerWidth;e<768?(this.config.horizontalSpacing=180,this.config.levelHeight=220,this.config.verticalSpacing=200):e<1200?(this.config.horizontalSpacing=200,this.config.levelHeight=250,this.config.verticalSpacing=220):(this.config.horizontalSpacing=220,this.config.levelHeight=280,this.config.verticalSpacing=250)}calculateLayout(e,o="hierarchical"){switch(this.positions.clear(),this.connections=[],this.adjustConfigForViewport(),o){case"hierarchical":this.calculateHierarchicalLayout(e);break;case"radial":this.calculateRadialLayout(e);break;case"compact":this.calculateCompactLayout(e);break;default:this.calculateHierarchicalLayout(e)}return this.generateConnections(e),this.positions}calculateHierarchicalLayout(e){if(e.type==="virtual_root"&&e.children){const o=new Map;o.set(0,e.children),e.children.forEach(t=>{this.groupNodesByLevel(t,1).forEach((a,i)=>{o.has(i)||o.set(i,[]),o.get(i).push(...a)})}),o.forEach((t,n)=>{this.layoutLevel(t,n)})}else this.groupNodesByLevel(e).forEach((t,n)=>{this.layoutLevel(t,n)})}calculateRadialLayout(e){this.positions.set(e.id,{x:0-this.config.nodeWidth/2,y:0-this.config.nodeHeight/2,level:0}),this.groupNodesByLevel(e).forEach((i,r)=>{if(r===0)return;const h=150+(r-1)*120,u=i.length;if(u===1){const N=0-this.config.nodeWidth/2,m=0-h-this.config.nodeHeight/2;this.positions.set(i[0].id,{x:N,y:m,level:r});return}const g=2*Math.PI/u,x=-Math.PI/2;i.forEach((N,m)=>{const S=x+m*g,V=0+h*Math.cos(S)-this.config.nodeWidth/2,A=0+h*Math.sin(S)-this.config.nodeHeight/2;this.positions.set(N.id,{x:V,y:A,level:r})})})}calculateCompactLayout(e){const o=this.getAllNodes(e),t=Math.ceil(Math.sqrt(o.length)),n=this.config.nodeWidth+40,a=this.config.nodeHeight+30;o.forEach((i,r)=>{const h=r%t,u=Math.floor(r/t),g=h*n-t*n/2,x=u*a-Math.ceil(o.length/t)*a/2;this.positions.set(i.id,{x:g,y:x,level:u})})}getAllNodes(e){const o=[e];return e.children&&e.children.forEach(t=>{o.push(...this.getAllNodes(t))}),o}groupNodesByLevel(e,o=0){const t=new Map,n=(a,i)=>{t.has(i)||t.set(i,[]),t.get(i).push(a),a.children&&a.children.forEach(r=>{n(r,i+1)})};return n(e,o),t}layoutLevel(e,o){if(e.length===0)return;const t=e.map(u=>this.getNodeActualWidth(u));let n=0;const a=50;for(let u=0;u<e.length;u++)if(n+=t[u],u<e.length-1){const g=Math.max(a,(t[u]+t[u+1])/4);n+=g}const i=-n/2,r=o*this.config.levelHeight;let h=i;e.forEach((u,g)=>{if(this.positions.set(u.id,{x:h,y:r,level:o}),h+=t[g],g<e.length-1){const x=Math.max(a,(t[g]+t[g+1])/4);h+=x}})}generateConnections(e){const o=t=>{t.children&&t.children.forEach(n=>{if(t.type!=="virtual_root"){const a={from:t.id,to:n.id,type:"output",logicType:t.gate_type,logicLabel:this.getLogicLabel(t),style:this.getConnectionStyle(t,n)};this.connections.push(a)}o(n)})};o(e)}getConnectionStyle(e,o){const t={color:"#C0C4CC",width:1.5};if(e.type==="logic_gate")switch(e.state){case"true":return{...t,color:"#67C23A",width:2};case"false":return{...t,color:"#F56C6C",width:2};default:return t}return t}getConnections(){return this.connections}generateSVGPath(e,o){const a=e.x+100,i=e.y+80,r=o.x+200/2,h=o.y+110/2,u=Math.abs(r-a),g=Math.abs(h-i);if(u<10)return`M ${a} ${i} L ${r} ${h}`;if(g<200){const A=Math.max(g*1.2,80),T=a,z=i+A,P=r,H=h-A*.5;return`M ${a} ${i} C ${T} ${z}, ${P} ${H}, ${r} ${h}`}const x=Math.min(g/3,60),N=a,m=i+x,S=r,V=h-x;return`M ${a} ${i} C ${N} ${m}, ${S} ${V}, ${r} ${h}`}getConnectionMidpoint(e,o){const a=e.x+100,i=e.y+80,r=o.x+200/2,h=o.y+110/2,u=(a+r)/2,g=(i+h)/2,x=15,N=Math.max(Math.min(g,h-x),i+x);return{x:u,y:N}}getLogicLabel(e){return e.type==="logic_gate"&&e.gate_type?{AND:"&",OR:"∨",NOT:"¬"}[e.gate_type]||"?":""}getLogicGateColor(e){return{AND:"#409EFF",OR:"#67C23A",NOT:"#E6A23C"}[e]||"#909399"}calculateViewBounds(){if(this.positions.size===0)return{width:1200,height:800,minX:0,minY:0};let e=1/0,o=-1/0,t=1/0,n=-1/0;this.positions.forEach((h,u)=>{e=Math.min(e,h.x),o=Math.max(o,h.x+this.config.nodeWidth),t=Math.min(t,h.y),n=Math.max(n,h.y+this.config.nodeHeight)});const a=100,i=50;return{width:o-e+a*2,height:n-t+i*2,minX:e-a,minY:t-i}}createHTMLStructure(e,o="hierarchical",t){const n=this.calculateLayout(e,o),a=this.calculateViewBounds(),i=t?.width||2200,r=t?.height||1400,h=20,u=i-h*2,g=r-h*2,x=u/a.width,N=g/a.height,m=Math.min(x,N,1);let S=`
    <div class="logic-gate-container" style="
      width: 100%; 
      height: 100%; 
      position: relative;
      background: #f8f9fa;
      border-radius: 8px;
      overflow: visible;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      padding: 15px;
    ">
      <div class="logic-gate-content" style="
        width: ${a.width}px;
        height: ${a.height}px;
        transform: scale(${m});
        transform-origin: top left;
        position: relative;
      ">
    `;return S+=this.renderConnectionsSVG(a),S+=this.renderNodes(e,n,a),S+="</div></div>",S+=`<style scoped>${this.getCSSStyles()}</style>`,S}renderConnectionsSVG(e){let o=`
    <svg 
      style="position: absolute; top: 0; left: 0; width: ${e.width}px; height: ${e.height}px; pointer-events: none;"
      viewBox="0 0 ${e.width} ${e.height}"
    >
    `;return this.connections.forEach(t=>{const n=this.positions.get(t.from),a=this.positions.get(t.to);if(n&&a){const i={x:n.x-e.minX,y:n.y-e.minY,level:n.level},r={x:a.x-e.minX,y:a.y-e.minY,level:a.level},h=this.generateSVGPath(i,r),u=t.style||{};o+=`
        <path 
          d="${h}" 
          stroke="${u.color||"#DCDFE6"}" 
          stroke-width="${u.width||1.5}"
          ${u.dashArray?`stroke-dasharray="${u.dashArray}"`:""}
          fill="none"
          class="connection-path"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.8"
        />
        `}}),o+="</svg>",o}renderNodes(e,o,t){let n="";const a=i=>{const r=o.get(i.id);if(r&&i.type!=="virtual_root"){const h=r.x-t.minX,u=r.y-t.minY;if(i.type==="logic_gate"){const g=this.getDoorShapeSVG(i.gate_type,i.state||"unknown");console.log("🔍 生成逻辑门SVG:",i.gate_type,g.substring(0,100)+"...");const x=180,N=220,m=200,S=110,V=h+m/2-x/2,A=u+S/2-N/2;n+=`
          <div 
            style="
              position: absolute !important;
              left: ${V}px !important;
              top: ${A}px !important;
              width: 180px !important;
              height: 220px !important;
              cursor: pointer !important;
              background: transparent !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              z-index: 10 !important;
              display: block !important;
            "
            data-node-id="${i.id}"
            data-node-type="logic_gate"
            onclick="console.log('🖱️ 逻辑门点击:', this.dataset.nodeId);"
            ondblclick="console.log('🖱️ 逻辑门双击:', this.dataset.nodeId);"
          >
            ${g}
          </div>
          `}else{const g=this.getNodeWidthStyle(i);n+=`
          <div 
            class="enhanced-tree-node fault-node"
            style="
              position: absolute;
              left: ${h}px;
              top: ${u}px;
              height: 110px;
              ${g}
              cursor: pointer;
              border: 2px solid #DCDFE6;
              background: white;
              border-radius: 20px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 10px 12px;
              white-space: normal;
              box-sizing: border-box;
              overflow: hidden;
            "
            data-node-id="${i.id}"
            data-node-type="${i.type}"
            onclick="
              console.log('🖱️ 故障节点点击:', this.dataset.nodeId);
              this.style.border = '3px solid #67C23A';
              this.style.boxShadow = '0 0 15px rgba(103, 194, 58, 0.5)';
              this.style.background = 'linear-gradient(135deg, #F0F9FF, #FFFFFF)';
              this.style.transform = 'scale(1.02)';
            "
            ondblclick="console.log('🖱️ 故障节点双击:', this.dataset.nodeId);"
          >
            ${this.renderNodeContent(i)}
          </div>
          `}}i.children&&i.children.forEach(a)};return a(e),n}renderNodeContent(e){return e.type==="logic_gate"?this.renderLogicGateContent(e):this.renderFaultNodeContent(e)}renderLogicGateContent(e){const o=e.gate_type;return this.getDoorShapeSVG(o,e.state||"unknown")}getNodeWidthStyle(e){const o=e.name||"故障节点",t=200;if(this.canTextFitInThreeLines(o,t))return`width: ${t}px !important;`;{const a=this.calculateRequiredWidthForThreeLines(o);return`width: ${Math.max(t,a)}px !important;`}}canTextFitInThreeLines(e,o){const a=o-30,i=Math.floor(a/11),r=i*3;return console.log(`🔍 文本长度: ${e.length}, 可用宽度: ${a}, 每行字符: ${i}, 三行最多: ${r}`),e.length<=r-6}calculateRequiredWidthForThreeLines(e){const a=Math.ceil(e.length/3)+4,i=a*11+30+20;return console.log(`📏 文本: "${e}", 长度: ${e.length}, 每行字符: ${a}, 所需宽度: ${i}px`),i}calculateRequiredWidth(e){if(e.length<=12)return e.length*14+24;const a=this.splitTextIntoLines(e,12);return Math.max(...a.map(r=>r.length))*14+24}splitTextIntoLines(e,o){if(e.length<=o)return[e];if(e.length<=o*3)return this.balanceTextLines(e,3);const t=[];let n="";for(const a of e)n.length<o?n+=a:(t.push(n),n=a);return n&&t.push(n),t}balanceTextLines(e,o){const t=e.length,n=Math.floor(t/o),a=t%o,i=[];let r=0;for(let h=0;h<o&&r<t;h++){const u=n+(h<a?1:0),g=Math.min(r+u,t),x=e.substring(r,g);x&&i.push(x),r=g}return i}canFitInThreeLines(e,o){const t=o-24,a=Math.floor(t/14)*3;return e.length<=a}needsWidthExpansion(e){return!!(e.length>24||e.split(/[\s\n]/).some(t=>t.length>12))}renderFaultNodeContent(e){const o=e.name||"故障节点",t=this.getNodeActualWidth(e),n=this.calculateMaxCharsPerLine(t),a=this.splitTextIntoLines(o,n);return console.log(`📝 渲染节点: "${o}", 宽度: ${t}px, 每行字符: ${n}`),console.log("📝 分行结果:",a.map((r,h)=>`第${h+1}行: "${r}" (${r.length}字)`).join(", ")),`
      <div class="node-content">
        ${a.slice(0,3).map(r=>`<div class="line">${r}</div>`).join("")}
      </div>
    `}getNodeActualWidth(e){const o=e.name||"故障节点",t=200;if(this.canTextFitInThreeLines(o,t))return t;{const a=this.calculateRequiredWidthForThreeLines(o);return Math.max(t,a)}}calculateMaxCharsPerLine(e){const n=e-30,a=Math.floor(n/11);return Math.max(a,6)}getGateSymbol(e){return{AND:"&",OR:"∨",NOT:"¬"}[e]||"?"}getDoorShapeSVG(e,o){const t={true:{fill:"#67C23A",stroke:"#529B2E",textColor:"#FFFFFF"},false:{fill:"#F56C6C",stroke:"#C45656",textColor:"#FFFFFF"},unknown:{fill:"#FFFFFF",stroke:"#DCDFE6",textColor:"#303133"}},n=t[o]||t.unknown,a=this.getGateSymbol(e);let i="";switch(e){case"OR":i="M40 25 L60 45 L60 75 Q40 60 20 75 L20 45 Z";break;case"AND":i="M20 75 L60 75 L60 45 Q60 25 40 25 Q20 25 20 45 Z";break;case"NOT":i="M20 85 Q10 95 40 95 Q70 95 60 85 L65 45 L40 10 L15 45 Z";break;default:i="M10 90 L70 90 L70 30 Q70 10 40 10 Q10 10 10 30 Z"}return`
      <svg viewBox="0 0 80 100" style="width: 180px !important; height: 220px !important; display: block !important;">
        <!-- 阴影效果 -->
        <defs>
          <filter id="shadow-${e}-${Date.now()}">
            <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        <!-- 门的形状：根据逻辑门类型变化 -->
        <path d="${i}" 
              fill="${n.fill}" 
              stroke="${n.stroke}" 
              stroke-width="2" 
              filter="url(#shadow-${e}-${Date.now()})" />
        <!-- 逻辑门符号 -->
        <text x="40" y="54" text-anchor="middle" 
              dominant-baseline="central"
              fill="${n.textColor}" 
              font-size="24" 
              font-weight="bold">${a}</text>
      </svg>
    `}getGateSVG(e,o){const t={true:"#67C23A",false:"#F56C6C",unknown:"#303133"},n=t[o]||t.unknown,a=this.getGateSymbol(e);return`<div class="gate-symbol" style="color: ${n}; font-size: 28px; font-weight: bold;">${a}</div>`}truncateText(e,o){return e.length>o?e.substring(0,o-3)+"...":e}getCSSStyles(){return`
    .logic-gate-container {
      font-family: 'Microsoft YaHei', sans-serif;
      user-select: none;
    }
    
    /* 逻辑门SVG强制显示 */
    svg {
      display: block !important;
    }
    
    /* 逻辑门容器样式 */
    div[data-node-type="logic_gate"] {
      background: transparent !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
      box-shadow: none !important;
      cursor: pointer !important;
    }

    div[data-node-type="logic_gate"]:hover {
      transform: scale(1.05) !important;
    }

    /* 故障节点 - 固定高度和宽度 */
    .enhanced-tree-node.fault-node {
      background: white;
      border: 2px solid #DCDFE6;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      cursor: pointer;
      pointer-events: auto;
      user-select: none;
      position: relative;
      z-index: 10;
      height: 110px !important;
      min-width: 200px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 10px 12px !important;
      white-space: normal !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      line-height: 1.3 !important;
    }

    .enhanced-tree-node.fault-node:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .enhanced-tree-node.fault-node.selected {
      border: 2px solid #67C23A !important;
      box-shadow: 0 0 10px rgba(103, 194, 58, 0.3) !important;
      background: linear-gradient(135deg, #F0F9FF, #FFFFFF) !important;
    }

    .enhanced-tree-node.fault-node.editing {
      border: 3px solid #409EFF !important;
      box-shadow: 0 0 15px rgba(64, 158, 255, 0.3) !important;
      background: linear-gradient(135deg, #E6F3FF, #FFFFFF) !important;
    }

    /* 逻辑门相关样式已移除，现在直接使用SVG */

    .node-name {
      font-size: 13px !important;
      font-weight: 500 !important;
      color: #303133 !important;
      text-align: center !important;
      line-height: 1.3 !important;
      display: block !important;
      word-wrap: break-word !important;
      hyphens: auto !important;
    }

    .node-content {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 2px !important;
      width: 100% !important;
    }

    .node-content .line {
      font-size: 12px !important;
      font-weight: 500 !important;
      color: #303133 !important;
      text-align: center !important;
      line-height: 1.2 !important;
      white-space: normal !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      max-width: 100% !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }


    .connection-path {
      transition: all 0.3s ease;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
    }

    .connection-path:hover {
      stroke-width: 2.5;
      opacity: 1;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }

    /* 逻辑符号样式 */
    .logic-symbol-container {
      transition: all 0.3s ease;
      z-index: 100;
    }

    .logic-symbol-shadow {
      opacity: 0.3;
    }

    .logic-symbol-bg {
      transition: all 0.3s ease;
      filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.15));
    }

    .logic-symbol-bg:hover {
      filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.25));
      transform: scale(1.05);
      stroke-width: 4 !important;
    }

    .logic-symbol-text {
      transition: all 0.3s ease;
      user-select: none;
      pointer-events: none;
      font-family: 'Arial', sans-serif;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* 逻辑门类型样式已移除 */

    /* 激活状态的逻辑符号 */
    .logic-symbol-container.active .logic-symbol-bg {
      stroke-width: 3;
      filter: drop-shadow(0 0 10px currentColor);
    }

    .logic-symbol-container.active .logic-symbol-text {
      font-weight: bolder;
    }
    `}updateConfig(e){this.config={...this.config,...e}}getNodeAtPosition(e,o){for(const[t,n]of this.positions)if(e>=n.x&&e<=n.x+this.config.nodeWidth&&o>=n.y&&o<=n.y+this.config.nodeHeight)return t;return null}highlightPath(e){e.forEach(o=>{const t=document.querySelector(`[data-node-id="${o}"]`);t&&t.classList.add("highlighted")})}clearHighlight(){document.querySelectorAll(".enhanced-tree-node.highlighted").forEach(e=>{e.classList.remove("highlighted")})}}function gt(){return new pt}class ft{nodes=new Map;connections=new Map;logicGates=[];parseWorkflow(e){this.clear(),e.nodes&&e.nodes.forEach(t=>{const n={id:t.id,name:t.name,type:t.type,parameters:t.parameters,position:t.position};this.nodes.set(t.id,n)}),e.connections&&Object.entries(e.connections).forEach(([t,n])=>{if(n.main&&Array.isArray(n.main)){const a=[];n.main.forEach(i=>{i.forEach(r=>{r.node&&a.push(r.node)})}),this.connections.set(t,a)}}),this.generateLogicGates();const o=this.buildFaultTree();return{nodes:Array.from(this.nodes.values()),connections:this.connections,logic_gates:this.logicGates,fault_tree:o}}generateLogicGates(){this.nodes.forEach((e,o)=>{if(this.isConditionNode(e)){const t=this.createLogicGateFromCondition(e);t&&this.logicGates.push(t)}})}isConditionNode(e){return e.name.includes("If：")||e.name.includes("是否")||e.type==="n8n-nodes-base.if"||e.parameters&&e.parameters.conditions}createLogicGateFromCondition(e){let o="OR",t="";if(e.name.includes("是否")&&(o="OR",t=this.extractConditionFromName(e.name)),e.parameters&&e.parameters.conditions){const i=e.parameters.conditions;i.conditions&&Array.isArray(i.conditions)&&(o=i.combinator==="and"?"AND":"OR",t=this.buildConditionExpression(i.conditions))}const n=this.getInputNodes(e.id),a=this.connections.get(e.id)||[];return{id:`gate_${e.id}`,type:"logic_gate",gate_type:o,name:this.cleanNodeName(e.name),description:`逻辑判断: ${t}`,condition:t,state:"unknown",input_nodes:n,output_nodes:a,position:e.position?{x:e.position[0],y:e.position[1]}:void 0}}extractConditionFromName(e){const o=e.match(/是否(.+?)？?$/);return o?o[1]:e}buildConditionExpression(e){return e.map(o=>{const t=o.leftValue||"",n=this.getOperatorSymbol(o.operator?.operation||"equals"),a=o.rightValue||"";return`${t} ${n} ${a}`}).join(" AND ")}getOperatorSymbol(e){return{equals:"==",notEquals:"!=",larger:">",largerEqual:">=",smaller:"<",smallerEqual:"<=",contains:"contains",notContains:"not contains"}[e]||e}getInputNodes(e){const o=[];return this.connections.forEach((t,n)=>{t.includes(e)&&o.push(n)}),o}cleanNodeName(e){return e.replace(/^If：/,"").replace(/？$/,"")}buildFaultTree(){const e=this.findRootNode();if(!e)throw new Error("无法找到workflow根节点");return this.buildTreeNode(e,new Set)}findRootNode(){const e=Array.from(this.nodes.keys()),o=new Set;this.connections.forEach(n=>{n.forEach(a=>o.add(a))});const t=e.filter(n=>!o.has(n));for(const n of t){const a=this.nodes.get(n);if(a.type.includes("webhook")||a.type.includes("manualTrigger"))return a}return t.length>0?this.nodes.get(t[0]):null}buildTreeNode(e,o){if(o.has(e.id))return{id:e.id,name:e.name,type:"fault_node"};o.add(e.id);const t=this.logicGates.find(i=>i.id===`gate_${e.id}`),n={id:e.id,name:this.getDisplayName(e),type:t?"logic_gate":"fault_node",description:this.getNodeDescription(e),position:e.position?{x:e.position[0],y:e.position[1]}:void 0};t&&(n.gate_type=t.gate_type,n.state=t.state,n.condition=t.condition);const a=this.connections.get(e.id)||[];return a.length>0&&(n.children=a.map(i=>{const r=this.nodes.get(i);return r?this.buildTreeNode(r,new Set(o)):null}).filter(Boolean)),n}getDisplayName(e){let o=e.name;return o=o.replace(/^If：/,""),o=o.replace(/？$/,""),o=o.replace(/^\d+\.\s*/,""),o||`节点_${e.id.slice(0,8)}`}getNodeDescription(e){return e.type.includes("webhook")?"数据输入入口":e.type.includes("manualTrigger")?"手动触发器":e.type.includes("if")?"条件判断节点":e.type.includes("switch")?"分支选择节点":e.type.includes("code")?"代码执行节点":"处理节点"}evaluateLogicGates(e){this.logicGates.forEach(o=>{o.state=this.evaluateGateCondition(o,e)})}evaluateGateCondition(e,o){if(!e.condition)return"unknown";try{return this.evaluateConditionExpression(e.condition,o)?"true":"false"}catch(t){return console.warn("条件评估失败:",e.condition,t),"unknown"}}evaluateConditionExpression(e,o){let t=e;Object.entries(o).forEach(([a,i])=>{const r=new RegExp(`\\$\\{${a}\\}|\\$json\\.${a}`,"g");t=t.replace(r,String(i))});const n=t.match(/(\d+(?:\.\d+)?)\s*(==|!=|>|>=|<|<=)\s*(\d+(?:\.\d+)?)/);if(n){const[,a,i,r]=n,h=parseFloat(a),u=parseFloat(r);switch(i){case"==":return h===u;case"!=":return h!==u;case">":return h>u;case">=":return h>=u;case"<":return h<u;case"<=":return h<=u;default:return!1}}return!1}clear(){this.nodes.clear(),this.connections.clear(),this.logicGates=[]}getDiagnosisPath(e){const o=[],t=Array.from(this.nodes.values()).find(n=>n.name.includes(e)||n.parameters&&JSON.stringify(n.parameters).includes(e));return t&&this.tracePath(t.id,o,new Set),o.reverse()}tracePath(e,o,t){if(t.has(e))return;t.add(e),o.push(e),this.getInputNodes(e).forEach(a=>{this.tracePath(a,o,t)})}}function mt(){return new ft}const yt={class:"enhanced-fault-tree"},vt={class:"tree-toolbar"},xt={style:{float:"left"}},wt={style:{float:"right",color:"#8492a6","font-size":"12px"}},_t={key:0,class:"logic-legend"},bt={class:"legend-header"},kt={class:"legend-content"},Ct=["innerHTML"],Ft={key:0},$t={class:"card-header"},Lt={style:{"margin-left":"8px"}},Nt={class:"reasoning-steps"},St={class:"step-header"},Tt={class:"step-content"},Et={class:"step-condition"},Mt={class:"step-reasoning"},Dt={class:"diagnosis-form"},Wt={class:"dialog-footer"},J=.2,ee=3,Vt=je({__name:"EnhancedFaultTree",props:{workflowData:{},faultTreeData:{},showToolbar:{type:Boolean,default:!0},interactive:{type:Boolean,default:!0}},emits:["node-click","node-double-click","diagnosis-complete"],setup(C,{expose:e,emit:o}){function t(s){if(!s)return null;const l=f=>{let k="fault_node",_;f.type==="gate_or"?(k="logic_gate",_="OR"):f.type==="gate_and"?(k="logic_gate",_="AND"):(f.type==="component"||f.type==="top_event")&&(k="fault_node");const M={id:f.level||f.name||`node_${Date.now()}_${Math.random()}`,name:f.name||"未命名节点",type:k,level:f.level||"未知层级",description:f.description||f.name,recommendation:f.recommendation,gate_type:_,state:"unknown",condition:f.condition,children:[]};return f.children&&Array.isArray(f.children)&&(M.children=f.children.map((D,pe)=>{const G=l(D);return G.type==="logic_gate"&&M.type==="logic_gate"?{id:`${G.id}结果`,name:G.name,type:"fault_node",level:`${G.level}_result`,description:`${G.name}的运算结果`,recommendation:"根据逻辑门条件判断结果",children:[G]}:G})),M},v=l(s);return v&&v.type==="logic_gate"?{id:`${v.id}结果`,name:v.name,type:"fault_node",level:"final_result",description:`${v.name}的最终诊断结果`,recommendation:"根据故障树分析得出的最终结论",children:[v]}:v}const n=C,a=o,i=W(null),r=W("hierarchical"),h=W(!0),u=W(!1),g=W(!1),x=W(!1),N=W(!0),m=W(null),S=W(!1),V=W(null),A=W([]),T=W(1),z=le({x:0,y:0}),P=W(!1),H=le({x:0,y:0}),E=le({h2:150,ch4:60,c2h6:20,c2h4:50,c2h2:150,h2_gas_generation_rate:400,total_hydrocarbons_content:300}),de=gt(),te=mt(),oe=[{label:"层次布局",value:"hierarchical",description:"传统的自上而下层次结构"},{label:"径向布局",value:"radial",description:"以根节点为中心的圆形分布"},{label:"紧凑布局",value:"compact",description:"网格式排列，节省空间"}],ye=Y(()=>({overflow:"hidden",position:"relative",width:"100%",height:"100%",background:"#f8f9fa",cursor:P.value?"grabbing":"grab"})),ve=Y(()=>({transform:`translate(${z.x}px, ${z.y}px) scale(${T.value})`,transformOrigin:"0 0",transition:P.value?"none":"transform 0.3s ease"})),ne=W("");qe([()=>n.workflowData,()=>n.faultTreeData,r],async()=>{await U(),ae()},{immediate:!0,deep:!0}),Qe(async()=>{window.ElMessage=Q,await U(),ae()});const ae=()=>{const s=document.getElementById("enhanced-fault-tree-styles");s&&s.remove();const l=document.createElement("style");l.id="enhanced-fault-tree-styles",l.textContent=de.getCSSStyles(),document.head.appendChild(l),console.log("✅ 故障树样式已强制重新应用")};Ue(()=>{});const U=async()=>{try{let s=null;if(n.workflowData?n.workflowData.nodes&&n.workflowData.connections?(V.value=te.parseWorkflow(n.workflowData),s=V.value.fault_tree):n.workflowData.ftree_json?s=t(n.workflowData.ftree_json):(V.value=te.parseWorkflow(n.workflowData),s=V.value.fault_tree):n.faultTreeData&&(s=n.faultTreeData),s){await fe();const l=i.value,v=l?.clientWidth||2e3,f=l?.clientHeight||1200;ne.value=de.createHTMLStructure(s,r.value,{width:v,height:f}),ae(),await fe(),setTimeout(()=>{Ne()},500)}else ne.value='<div class="empty-message">无故障树数据</div>'}catch(s){console.error("渲染故障树失败:",s)}},ie=s=>{const l=v=>{if(v.id===s)return v;if(v.children)for(const f of v.children){const k=l(f);if(k)return k}return null};return V.value?l(V.value.fault_tree):n.faultTreeData?l(n.faultTreeData):null},xe=s=>{A.value=[{step_id:`step_${s.id}_1`,gate_id:s.id,gate_type:s.gate_type,condition:s.condition||"",inputs:[],output:s.state==="true",reasoning:`根据输入条件判断，${s.gate_type}门的输出为${s.state==="true"?"真":"假"}`,timestamp:new Date().toISOString()}]},we=()=>{T.value<ee&&(T.value=Math.min(T.value*1.2,ee))},_e=()=>{T.value>J&&(T.value=Math.max(T.value/1.2,J))},he=()=>{T.value=1,z.x=0,z.y=0},be=s=>{s.preventDefault();const l=s.deltaY>0?.9:1.1,v=Math.min(Math.max(T.value*l,J),ee);T.value=v},ke=s=>{s.button===0&&(P.value=!0,H.x=s.clientX,H.y=s.clientY)},Ce=s=>{if(P.value){const l=s.clientX-H.x,v=s.clientY-H.y;z.x+=l,z.y+=v,H.x=s.clientX,H.y=s.clientY}},Fe=()=>{P.value=!1},$e=s=>{i.value?.querySelectorAll(".logic-gate")?.forEach(v=>{v.style.display=s?"block":"none"})},Le=s=>{s.target===s.currentTarget&&(console.log("🎯 点击空白区域，清除选中状态"),m.value=null,S.value=!1,u.value=!1,i.value?.querySelectorAll(".enhanced-tree-node")?.forEach(v=>{const f=v;f.classList.remove("selected","editing"),f.style.border="2px solid #DCDFE6",f.style.boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)",f.style.background="white",f.style.transform="none"}))},ue=()=>{Q.info("导出功能开发中...")},Ne=()=>{const s=i.value?.querySelectorAll(".enhanced-tree-node");s&&s.length>0&&s.forEach(l=>{const v=l;v.style.cursor="pointer",v.addEventListener("click",function(){const f=this.dataset.nodeId;if(s.forEach(_=>{const M=_;M.style.border="2px solid #DCDFE6",M.style.boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)",M.style.background="white",M.style.transform="none"}),this.style.border="3px solid #409EFF",this.style.boxShadow="0 0 15px rgba(64, 158, 255, 0.5)",this.style.background="linear-gradient(135deg, #E6F3FF, #FFFFFF)",this.style.transform="scale(1.02)",window.selectedNodeIdRef&&f&&(window.selectedNodeIdRef.value=f),window.handleEditTreeNodeClick&&f){const _=ie(f);_&&window.handleEditTreeNodeClick(_)}const k=f?ie(f):null;k&&(m.value=k,S.value=!1,a("node-click",k))}),v.addEventListener("dblclick",function(f){f.stopPropagation();const k=this.dataset.nodeId;s.forEach(M=>{const D=M;D.style.border="2px solid #DCDFE6",D.style.boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)",D.style.background="white",D.style.transform="none"}),this.style.border="4px solid #409EFF",this.style.boxShadow="0 0 20px rgba(64, 158, 255, 0.5)",this.style.background="linear-gradient(135deg, #E6F3FF, #FFFFFF)",this.style.transform="scale(1.05)";const _=k?ie(k):null;_?(m.value=_,S.value=!0,u.value=!0,a("node-double-click",_),_.type==="logic_gate"&&xe(_)):k&&(m.value={id:k,name:k,type:"fault_node",level:"未知",description:"无法获取详细信息"},u.value=!0)})})},Se=async()=>{x.value=!0;try{V.value&&(te.evaluateLogicGates(E),await U(),Q.success("诊断完成"),a("diagnosis-complete",E))}catch(s){console.error("诊断失败:",s),Q.error("诊断失败")}finally{x.value=!1,g.value=!1}},Te=s=>s==="logic_gate"?"warning":"info",Ee=s=>s==="logic_gate"?"逻辑门":"故障节点",Me=s=>s?{AND:"与门",OR:"或门",NOT:"非门"}[s]||s:"未知",De=s=>({true:"success",false:"danger",unknown:"info"})[s]||"info",We=s=>({true:"真",false:"假",unknown:"未知"})[s]||s,Ve=async s=>{console.log("布局切换:",s),z.x=0,z.y=0,T.value=1,await U(),Q.success(`已切换到${Ae(s)}`)},Ie=s=>({hierarchical:"🌳",radial:"🎯",compact:"🔲"})[s]||"📊",Ae=s=>oe.find(v=>v.value===s)?.label||s,ze=()=>{N.value=!N.value};return e({showDiagnosisDialog:()=>{g.value=!0},resetView:he,exportImage:ue,changeLayout:s=>{r.value=s}}),(s,l)=>{const v=b("el-option"),f=b("el-select"),k=b("el-tooltip"),_=b("el-col"),M=b("el-icon"),D=b("el-button"),pe=b("el-button-group"),G=b("el-switch"),X=b("el-row"),Ge=b("el-collapse-transition"),Z=b("el-tag"),q=b("el-descriptions-item"),He=b("el-text"),Oe=b("el-descriptions"),se=b("el-card"),Pe=b("el-alert"),Ye=b("el-drawer"),B=b("el-input-number"),j=b("el-form-item"),Re=b("el-form"),Xe=b("el-dialog");return w(),$("div",yt,[p("div",vt,[c(X,{gutter:16,align:"middle"},{default:d(()=>[c(_,{span:6},{default:d(()=>[c(k,{effect:"dark",placement:"bottom"},{content:d(()=>[(w(),$(R,null,re(oe,y=>p("div",{key:y.value,style:{"margin-bottom":"4px"}},[p("strong",null,F(y.label)+":",1),L(" "+F(y.description),1)])),64))]),default:d(()=>[c(f,{modelValue:r.value,"onUpdate:modelValue":l[0]||(l[0]=y=>r.value=y),placeholder:"选择布局模式",size:"small",onChange:Ve},{default:d(()=>[(w(),$(R,null,re(oe,y=>c(v,{key:y.value,label:y.label,value:y.value},{default:d(()=>[p("span",xt,F(y.label),1),p("span",wt,F(Ie(y.value)),1)]),_:2},1032,["label","value"])),64))]),_:1},8,["modelValue"])]),_:1})]),_:1}),c(_,{span:8},{default:d(()=>[c(pe,{size:"small"},{default:d(()=>[c(D,{onClick:we,disabled:T.value>=ee},{default:d(()=>[c(M,null,{default:d(()=>[c(K(Ze))]),_:1})]),_:1},8,["disabled"]),c(D,{onClick:he},{default:d(()=>[L(F(Math.round(T.value*100))+"% ",1)]),_:1}),c(D,{onClick:_e,disabled:T.value<=J},{default:d(()=>[c(M,null,{default:d(()=>[c(K(Ke))]),_:1})]),_:1},8,["disabled"])]),_:1})]),_:1}),c(_,{span:6},{default:d(()=>[c(G,{modelValue:h.value,"onUpdate:modelValue":l[1]||(l[1]=y=>h.value=y),"active-text":"显示逻辑门","inactive-text":"隐藏逻辑门",size:"small",onChange:$e},null,8,["modelValue"])]),_:1}),c(_,{span:4},{default:d(()=>[c(D,{size:"small",onClick:ue},{default:d(()=>[c(M,null,{default:d(()=>[c(K(Je))]),_:1}),l[11]||(l[11]=L(" 导出 ",-1))]),_:1})]),_:1})]),_:1})]),p("div",{ref_key:"treeContainer",ref:i,class:"tree-container",style:ce(ye.value),onWheel:be,onMousedown:ke,onMousemove:Ce,onMouseup:Fe},[h.value?(w(),$("div",_t,[p("div",bt,[c(M,null,{default:d(()=>[c(K(et))]),_:1}),l[12]||(l[12]=p("span",null,"逻辑关系图例",-1)),c(D,{type:"text",size:"small",onClick:ze,class:"legend-toggle"},{default:d(()=>[L(F(N.value?"收起":"展开"),1)]),_:1})]),c(Ge,null,{default:d(()=>[tt(p("div",kt,[...l[13]||(l[13]=[p("div",{class:"legend-item"},[p("div",{class:"legend-symbol and-symbol"},[p("svg",{width:"20",height:"20",viewBox:"0 0 20 20"},[p("circle",{cx:"10",cy:"10",r:"8",fill:"white",stroke:"#409EFF","stroke-width":"2"}),p("text",{x:"10",y:"14","text-anchor":"middle","font-size":"12","font-weight":"bold",fill:"#409EFF"},"&")])]),p("span",{class:"legend-text"},"与门（AND）- 所有条件同时满足")],-1),p("div",{class:"legend-item"},[p("div",{class:"legend-symbol or-symbol"},[p("svg",{width:"20",height:"20",viewBox:"0 0 20 20"},[p("circle",{cx:"10",cy:"10",r:"8",fill:"white",stroke:"#67C23A","stroke-width":"2"}),p("text",{x:"10",y:"14","text-anchor":"middle","font-size":"12","font-weight":"bold",fill:"#67C23A"},"∨")])]),p("span",{class:"legend-text"},"或门（OR）- 任一条件满足即可")],-1),p("div",{class:"legend-item"},[p("div",{class:"legend-symbol not-symbol"},[p("svg",{width:"20",height:"20",viewBox:"0 0 20 20"},[p("circle",{cx:"10",cy:"10",r:"8",fill:"white",stroke:"#E6A23C","stroke-width":"2"}),p("text",{x:"10",y:"14","text-anchor":"middle","font-size":"12","font-weight":"bold",fill:"#E6A23C"},"¬")])]),p("span",{class:"legend-text"},"非门（NOT）- 条件取反")],-1)])],512),[[ot,N.value]])]),_:1})])):I("",!0),p("div",{class:"tree-content",style:ce(ve.value),innerHTML:ne.value,onClick:Le},null,12,Ct)],36),c(Ye,{modelValue:u.value,"onUpdate:modelValue":l[2]||(l[2]=y=>u.value=y),title:"节点详情",direction:"rtl",size:"400px","z-index":9999},{default:d(()=>[m.value?(w(),$("div",Ft,[c(se,{class:"node-info-card",shadow:"never"},{header:d(()=>[p("div",$t,[p("span",null,F(m.value.name),1),c(Z,{type:Te(m.value.type)},{default:d(()=>[L(F(Ee(m.value.type)),1)]),_:1},8,["type"])])]),default:d(()=>[c(Oe,{column:1,size:"small",border:""},{default:d(()=>[m.value.type==="logic_gate"?(w(),O(q,{key:0,label:"逻辑门类型"},{default:d(()=>[m.value.gate_type&&m.value.state?(w(),O(ut,{key:0,"gate-type":m.value.gate_type,state:m.value.state,size:"small",interactive:!1},null,8,["gate-type","state"])):I("",!0),p("span",Lt,F(Me(m.value.gate_type)),1)]),_:1})):I("",!0),m.value.state?(w(),O(q,{key:1,label:"当前状态"},{default:d(()=>[c(Z,{type:De(m.value.state)},{default:d(()=>[L(F(We(m.value.state)),1)]),_:1},8,["type"])]),_:1})):I("",!0),m.value.condition?(w(),O(q,{key:2,label:"判断条件"},{default:d(()=>[c(He,{class:"condition-text",type:"info"},{default:d(()=>[L(F(m.value.condition),1)]),_:1})]),_:1})):I("",!0),m.value.description?(w(),O(q,{key:3,label:"描述"},{default:d(()=>[L(F(m.value.description),1)]),_:1})):I("",!0),m.value.children?(w(),O(q,{key:4,label:"子节点数"},{default:d(()=>[L(F(m.value.children.length),1)]),_:1})):I("",!0)]),_:1})]),_:1}),m.value.type==="logic_gate"&&A.value.length>0?(w(),O(se,{key:0,class:"reasoning-card",shadow:"never"},{header:d(()=>[...l[14]||(l[14]=[p("span",null,"推理过程",-1)])]),default:d(()=>[p("div",Nt,[(w(!0),$(R,null,re(A.value,(y,Be)=>(w(),$("div",{key:y.step_id,class:"reasoning-step"},[p("div",St,[c(Z,{size:"small",type:"primary"},{default:d(()=>[L("步骤 "+F(Be+1),1)]),_:2},1024),c(Z,{size:"small",type:y.output?"success":"danger"},{default:d(()=>[L(F(y.output?"真":"假"),1)]),_:2},1032,["type"])]),p("div",Tt,[p("p",Et,F(y.condition),1),p("p",Mt,F(y.reasoning),1)])]))),128))])]),_:1})):I("",!0),m.value.recommendation?(w(),O(se,{key:1,class:"recommendation-card",shadow:"never"},{header:d(()=>[...l[15]||(l[15]=[p("span",null,"诊断建议",-1)])]),default:d(()=>[c(Pe,{title:m.value.recommendation,type:"info",closable:!1,"show-icon":""},null,8,["title"])]),_:1})):I("",!0)])):I("",!0)]),_:1},8,["modelValue"]),c(Xe,{modelValue:g.value,"onUpdate:modelValue":l[10]||(l[10]=y=>g.value=y),title:"诊断参数输入",width:"600px"},{footer:d(()=>[p("span",Wt,[c(D,{onClick:l[9]||(l[9]=y=>g.value=!1)},{default:d(()=>[...l[16]||(l[16]=[L("取消",-1)])]),_:1}),c(D,{type:"primary",onClick:Se,loading:x.value},{default:d(()=>[...l[17]||(l[17]=[L(" 运行诊断 ",-1)])]),_:1},8,["loading"])])]),default:d(()=>[p("div",Dt,[c(Re,{model:E,"label-width":"120px",size:"small"},{default:d(()=>[c(X,{gutter:16},{default:d(()=>[c(_,{span:12},{default:d(()=>[c(j,{label:"H2 (ppm)"},{default:d(()=>[c(B,{modelValue:E.h2,"onUpdate:modelValue":l[3]||(l[3]=y=>E.h2=y),min:0,max:1e4,style:{width:"100%"}},null,8,["modelValue"])]),_:1})]),_:1}),c(_,{span:12},{default:d(()=>[c(j,{label:"CH4 (ppm)"},{default:d(()=>[c(B,{modelValue:E.ch4,"onUpdate:modelValue":l[4]||(l[4]=y=>E.ch4=y),min:0,max:1e4,style:{width:"100%"}},null,8,["modelValue"])]),_:1})]),_:1})]),_:1}),c(X,{gutter:16},{default:d(()=>[c(_,{span:12},{default:d(()=>[c(j,{label:"C2H6 (ppm)"},{default:d(()=>[c(B,{modelValue:E.c2h2,"onUpdate:modelValue":l[5]||(l[5]=y=>E.c2h2=y),min:0,max:1e3,style:{width:"100%"}},null,8,["modelValue"])]),_:1})]),_:1}),c(_,{span:12},{default:d(()=>[c(j,{label:"C2H4 (ppm)"},{default:d(()=>[c(B,{modelValue:E.c2h4,"onUpdate:modelValue":l[6]||(l[6]=y=>E.c2h4=y),min:0,max:1e3,style:{width:"100%"}},null,8,["modelValue"])]),_:1})]),_:1})]),_:1}),c(X,{gutter:16},{default:d(()=>[c(_,{span:12},{default:d(()=>[c(j,{label:"C2H2 (ppm)"},{default:d(()=>[c(B,{modelValue:E.c2h2,"onUpdate:modelValue":l[7]||(l[7]=y=>E.c2h2=y),min:0,max:1e3,style:{width:"100%"}},null,8,["modelValue"])]),_:1})]),_:1})]),_:1}),c(X,{gutter:16},{default:d(()=>[c(_,{span:12},{default:d(()=>[c(j,{label:"h2_gas_generation_rate"},{default:d(()=>[c(B,{modelValue:E.h2_gas_generation_rate,"onUpdate:modelValue":l[8]||(l[8]=y=>E.h2_gas_generation_rate=y),min:0,max:2e4,style:{width:"100%"}},null,8,["modelValue"])]),_:1})]),_:1})]),_:1})]),_:1},8,["model"])])]),_:1},8,["modelValue"])])}}}),zt=me(Vt,[["__scopeId","data-v-cd91413a"]]);export{zt as E,ut as L};
