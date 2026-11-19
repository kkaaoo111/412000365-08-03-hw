
// Block 3-V：往後若要用 vibe coding 增加互動功能，可從這個檔案修改。
(() => {
  const data = JSON.parse(document.getElementById('network-data').textContent);
  const metricSelect = document.getElementById('metric-select');
  const metricTitle = document.getElementById('metric-title');
  const infoBox = document.getElementById('selected-info');
  const names = {
    degree: 'Degree Centrality',
    betweenness: 'Betweenness Centrality',
    eigenvector: 'Eigenvector Centrality'
  };
  const originalNodes = data.nodes;
  const originalEdges = data.edges;
  const rawValues = (metric) => originalNodes.map(node => Number(node[metric]) || 0);

  // 依目前指標的最小值與最大值，將節點大小縮放到 14～48。
  function nodeSize(node, metric) {
    const values = rawValues(metric);
    const low = Math.min(...values);
    const high = Math.max(...values);
    const normalized = high === low ? 0.5 : (node[metric] - low) / (high - low);
    return 14 + normalized * 34;
  }

  const nodes = new vis.DataSet(originalNodes.map(node => ({
    ...node,
    size: nodeSize(node, 'degree'),
    hidden: false,
    title: `${node.label}\nDegree: ${node.degree.toFixed(3)}\nBetweenness: ${node.betweenness.toFixed(3)}\nEigenvector: ${node.eigenvector.toFixed(3)}`
  })));
  const edges = new vis.DataSet(originalEdges.map(edge => ({ ...edge, hidden: false })));

  const network = new vis.Network(document.getElementById('network'), { nodes, edges }, {
    autoResize: true,
    physics: false,
    interaction: { dragNodes:true, dragView:true, zoomView:true, hover:true },
    nodes: {
      shape: 'dot',
      borderWidth: 1.5,
      color: {
        background: '#58a6ff',
        border: '#a5d6ff',
        highlight: { background: '#f0883e', border: '#ffd8b5' },
        hover: { background: '#79c0ff', border: '#cae8ff' }
      },
      font: { size: 15, color: '#f0f6fc', strokeWidth: 3, strokeColor: '#0d1117' }
    },
    edges: {
      color: { color: '#4b5b6e', highlight: '#79c0ff', hover: '#79c0ff' },
      width: 1.4,
      smooth: false
    }
  });

  // 只保留點擊的節點與其 1-hop 鄰近節點；傳入 null 則恢復顯示全部節點與邊。
  function filterNeighborhood(selectedId) {
    if (!selectedId) {
      nodes.update(originalNodes.map(n => ({ id: n.id, hidden: false })));
      edges.update(originalEdges.map(e => ({ id: e.id, hidden: false })));
      return;
    }
    const neighborIds = new Set([selectedId]);
    originalEdges.forEach(e => {
      if (e.from === selectedId) neighborIds.add(e.to);
      if (e.to === selectedId) neighborIds.add(e.from);
    });
    nodes.update(originalNodes.map(n => ({
      id: n.id,
      hidden: !neighborIds.has(n.id)
    })));
    edges.update(originalEdges.map(e => ({
      id: e.id,
      hidden: !(e.from === selectedId || e.to === selectedId)
    })));
  }

  function displaySelection(nodeId) {
    const node = originalNodes.find(n => n.id === nodeId);
    if (!node) {
      infoBox.textContent = '點選節點可以查看其分數。';
      return;
    }
    infoBox.textContent = `${node.label}｜${names[metricSelect.value]}：${Number(node[metricSelect.value]).toFixed(3)}`;
  }

  // 只修改節點大小，不重新建立 network，維持節點座標。
  metricSelect.addEventListener('change', () => {
    const metric = metricSelect.value;
    metricTitle.textContent = names[metric];
    nodes.update(originalNodes.map(node => ({ id:node.id, size:nodeSize(node, metric) })));
    const selected = network.getSelectedNodes();
    if (selected.length) displaySelection(selected[0]);
  });

  network.on('selectNode', params => {
    const selectedId = params.nodes[0];
    displaySelection(selectedId);
    filterNeighborhood(selectedId);
  });

  network.on('deselectNode', () => {
    displaySelection(null);
    filterNeighborhood(null);
  });
})();
