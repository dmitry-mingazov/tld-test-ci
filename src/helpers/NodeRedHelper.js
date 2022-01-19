const createConfigNode = (interfaceType) => {
    const configNode = {};
    switch(interfaceType){
        case interfaceType.match(/^mqtt/)?.input:
            configNode['type'] = 'mqtt-broker'
            return configNode;
        case interfaceType.match(/^websocket/)?.input:
            return configNode;
        default:
            return;
    }
};

const mappedMetadata = {
    'status': 'statusCode',
    'typeIn': 'server',
    'typeOut': 'beserver',
    'address': 'addr',
}

const mapMetadataTypeToKey = (metadataType, value) => {
    let key  = mappedMetadata[metadataType] || metadataType;
    if(metadataType === 'type') {
        if (value === 'websocket-listener') {
            key = 'server';
        } else if (value === 'websocket-client') {
            key = 'client';
        }
    }
    return key;
};

const mapConfigValue = (metadataType, value, configNode) => {
    const _configNode = {...configNode};
    let _value = value;
    switch(metadataType) {
        case 'port':
        case 'protocolVersion':
        case 'path':
            _configNode[metadataType] = value;
            _value = undefined;
             break;
        case 'url':
            _configNode['path'] = value;
            _value = undefined;
            break;
        case 'broker':
        case 'type':
            _configNode[metadataType] = value;
            _value = _configNode.id;
    }
    return [_value, _configNode];
};

const createGroupNode = (deviceName, serviceNodes, groupId) => {
    const id = groupId;
    const type = 'group';
    const nodes = [];
    const name = deviceName;
    const style = {label: true}
    serviceNodes.forEach((node) => {
        node['g'] = id;
        nodes.push(node['id']);
    })

    return {
        id,
        name,
        type,
        style,
        nodes
    }
}

const DEFAULT_X = 120;
const Y_OFFSET = 45;

class NodeRedHelper {
    static getNodesFromDevice(device, getUniqueIds, _y) {
        const nodes = [];
        const configs = [];
        var x = DEFAULT_X;
        var y = _y; 
        device.services.forEach(s => {
            const node = {x, y};
            y += Y_OFFSET;
            let configNode = createConfigNode(s.interfaceType);
            if (configNode) {
                configNode.id = getUniqueIds(device._id, 1)[0];
            }
            node.type = s.interfaceType === 'http out' ? 'http response' : s.interfaceType;
            node.name = node.type;
            s.metadata.forEach(m => {
                let key = mapMetadataTypeToKey(m.metadataType, m.value);
                let value = m.value;
                if (configNode) {
                    [value, configNode] = mapConfigValue(m.metadataType, m.value, configNode)
                } 
                if (value) {
                    node[key] = value;
                }
            });
            if(configNode) {
                configs.push(configNode)
            }
            nodes.push(node);
        });
        // add id to each node
        const ids = getUniqueIds(device._id, nodes.length);
        for(let i = 0; i < nodes.length; i++) {
            nodes[i].id = ids[i];
        }

        const groupNode = createGroupNode(device.name, nodes, getUniqueIds(device._id, 1)[0])
        nodes.push(groupNode);

        return {
            nodes,
            configs,
            y
        }
    }

    // static updateFlow(flowId, )

    static createEmptyFlow() {
        return {
            nodes: []
        }
    }

    static createCommentNode(flowId, comment, {x, y}) {
        const id = `${flowId}|DESC`;
        const type = 'comment';
        const name = 'Flow Description';
        return {
            id,
            x,
            y,
            type,
            name,
            info: comment
        }
    }


    static createFlowFromDevices(flowId, devices,label, comment, getUniqueIds) {
        const _nodes = [];
        const _configs = [];
        var _y = 100;
        var x = DEFAULT_X;

        const commentNode = this.createCommentNode(flowId, comment, {x, _y});
        _y += Y_OFFSET * 2;
        _nodes.push(commentNode);

        devices.forEach(device => {
            const  { nodes, configs, y } = this.getNodesFromDevice(device, getUniqueIds, _y);
            // to space more each group
            _y = y + Y_OFFSET;
            _nodes.push(...nodes);
            _configs.push(...configs);
        });
        return {
            label,
            _nodes,
            _configs
        }
    }

}    

export default NodeRedHelper;