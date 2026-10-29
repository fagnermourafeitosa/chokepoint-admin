"use strict";
const scopes = [
    { id: 'agent_tool', label: 'This agent + this tool', detail: 'Default · every authorized user of this agent' },
    { id: 'tool', label: 'This tool · all agents', detail: 'Applies wherever the tool has already been granted' },
    { id: 'agent_all', label: 'This agent · all tools', detail: 'Shared execution context only, across its capabilities' },
    { id: 'team_tool', label: 'User team + this tool', detail: 'For the selected IdP team, across agents' },
    { id: 'team_agent_tool', label: 'User team + agent + tool', detail: 'Narrower restriction for a team on one agent' },
    { id: 'user_tool', label: 'One user + this tool', detail: 'Across agents this user is allowed to use' },
    { id: 'user_agent_tool', label: 'One user + agent + tool', detail: 'Most specific restriction; never overrides other rules' },
    { id: 'team_all', label: 'One user team · all agents and tools', detail: 'Baseline restrictions across all authorized actions of this IdP team' },
    { id: 'user_all', label: 'One user · all agents and tools', detail: 'Baseline restrictions for this identity across permitted capabilities' }
];
const hasAgent = (scope) => ['agent_tool', 'agent_all', 'team_agent_tool', 'user_agent_tool'].includes(scope);
const hasTool = (scope) => !['agent_all', 'team_all', 'user_all'].includes(scope);
const hasUser = (scope) => ['user_tool', 'user_agent_tool', 'user_all'].includes(scope);
const hasTeam = (scope) => ['team_tool', 'team_agent_tool', 'team_all'].includes(scope);
function scopeKey(t) { return ['scope', t.scope, hasAgent(t.scope) ? t.agentId : '', hasTool(t.scope) ? t.toolId : '', hasUser(t.scope) ? t.userId : '', hasTeam(t.scope) ? t.team : ''].join('|'); }
function parseScopeKey(key) {
    const [, scope, agentId = '', toolId = '', userId = '', team = ''] = key.split('|');
    return { scope: scope, agentId, toolId, userId, team };
}
function migratePolicies(raw) {
    const out = {};
    for (const [key, policy] of Object.entries(raw || {})) {
        if (key.startsWith('scope|'))
            out[key] = policy;
        else if (key.includes('::')) {
            const [agentId, toolId] = key.split('::');
            out[scopeKey({ scope: 'agent_tool', agentId, toolId, userId: '', team: '' })] = policy;
        }
    }
    return out;
}
function matchesScope(t, agentId, user, toolId) {
    return (!hasAgent(t.scope) || t.agentId === agentId) && (!hasTool(t.scope) || t.toolId === toolId) && (!hasUser(t.scope) || t.userId === user.id) && (!hasTeam(t.scope) || t.team === user.team);
}
const sourceLabels = { arguments: 'MCP tool arguments · schema only', identity: 'Verified IdP', agent: 'Agent registry', runtime: 'Gateway context', provider: 'OpenAPI mapping · resolution pending' };
const sharedAttributes = [
    { id: 'identity.team', label: 'Team', kind: 'text', source: 'identity', example: 'Engineering' },
    { id: 'identity.status', label: 'Identity status', kind: 'choice', source: 'identity', options: ['active', 'disabled'] },
    { id: 'agent.environment', label: 'Agent environment', kind: 'choice', source: 'agent', options: ['production', 'development'] },
    { id: 'agent.status', label: 'Agent status', kind: 'choice', source: 'agent', options: ['active', 'draft'] },
    { id: 'runtime.environment', label: 'Execution environment', kind: 'choice', source: 'runtime', options: ['production', 'staging', 'development'], example: 'production' },
    { id: 'runtime.channel', label: 'Request channel', kind: 'choice', source: 'runtime', options: ['API', 'Web', 'Scheduled'], example: 'API' },
];
const arg = (key, label, kind, example, options) => ({ id: 'arguments.' + key, label, kind, source: 'arguments', example, options });
const toolAttributeSeeds = {
    'payments.create': [arg('amount', 'Amount', 'number', '700'), arg('currency', 'Currency', 'choice', 'BRL', ['BRL', 'USD', 'EUR'])],
    'tickets.reply': [arg('visibility', 'Reply visibility', 'choice', 'Internal', ['Internal', 'Public']), arg('priority', 'Ticket priority', 'choice', 'Normal', ['Low', 'Normal', 'Urgent'])],
    'pull_requests.merge': [arg('repository', 'Repository', 'text', 'acme/backend'), arg('pr_number', 'Pull request number', 'number', '142'), arg('target_branch', 'Target branch (requested)', 'text', 'develop')],
    'files.read': [arg('purpose', 'Access purpose', 'choice', 'Research', ['Research', 'Support', 'Export'])],
    'files.share': [arg('visibility', 'Share visibility', 'choice', 'Internal', ['Private', 'Internal', 'Public'])],
    'customers.update': [arg('field', 'Field being changed', 'text', 'contact_email'), arg('customer_region', 'Customer region', 'choice', 'BR', ['BR', 'US', 'EU'])],
    'customers.delete': [arg('reason', 'Deletion reason', 'text', 'User request')],
    'issues.create': [arg('repository', 'Repository', 'text', 'customer-api'), arg('priority', 'Issue priority', 'choice', 'Medium', ['Low', 'Medium', 'High'])],
    'invoices.create': [arg('customer_segment', 'Customer segment', 'choice', 'SMB', ['SMB', 'Enterprise'])],
    'crm.contacts.export': [arg('format', 'Export format', 'choice', 'CSV', ['CSV', 'JSON']), arg('record_count', 'Record count', 'number', '100')],
    'orders.cancel': [arg('order_id', 'Order ID', 'text', 'ord_142'), arg('reason', 'Cancellation reason', 'text', 'Customer request')],
    'orders.get': [arg('order_id', 'Order ID', 'text', 'ord_142')],
};
const attributeCatalog = (toolId, bindings, sources) => {
    const external = bindings.filter(b => b.toolId === toolId).map(b => {
        const source = sources.find(x => x.id === b.sourceId), operation = source === null || source === void 0 ? void 0 : source.operations.find(x => x.key === b.operationKey), field = operation === null || operation === void 0 ? void 0 : operation.fields.find(x => x.path === b.fieldPath);
        if (!source || !operation || !field)
            return null;
        return { id: 'provider.' + b.id, label: source.name + ' / ' + field.path, kind: field.kind, source: 'provider', options: field.options, origin: source.name + ' · GET ' + operation.path };
    }).filter(Boolean);
    return (toolAttributeSeeds[toolId] || []).concat(sharedAttributes, external);
};
const exampleOpenAPI = {
    openapi: '3.1.0', info: { title: 'Orders API', version: '1.0.0' }, servers: [{ url: 'https://api.example.com' }],
    paths: { '/orders/{id}': { get: { summary: 'Get order by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Order', content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string', enum: ['pending', 'shipped', 'cancelled'] }, total: { type: 'number' }, customer_id: { type: 'string' }, owner: { type: 'object', properties: { team: { type: 'string' } } } } } } } } } } }, '/orders/{id}/cancel': { post: { summary: 'Cancel order', responses: { '204': { description: 'Cancelled' } } } } }
};
function resolveLocalRef(spec, ref) {
    if (!ref.startsWith('#/'))
        throw Error('Only local schema references (#/...) are supported');
    let node = spec;
    for (const part of ref.slice(2).split('/')) {
        node = node === null || node === void 0 ? void 0 : node[part.replace(/~1/g, '/').replace(/~0/g, '~')];
        if (!node)
            throw Error('Unresolved schema reference: ' + ref);
    }
    return node;
}
function flattenSchema(schema, spec, prefix = '', depth = 0, seen = new Set()) {
    if (!schema || depth > 12)
        return [];
    if (schema.$ref) {
        if (seen.has(schema.$ref))
            return [];
        return flattenSchema(resolveLocalRef(spec, schema.$ref), spec, prefix, depth + 1, new Set([...seen, schema.$ref]));
    }
    if (schema.allOf || schema.oneOf || schema.anyOf) {
        const branches = schema.allOf || schema.oneOf || schema.anyOf;
        return branches.flatMap((part) => flattenSchema(part, spec, prefix, depth + 1, seen));
    }
    if (schema.type === 'object' || schema.properties) {
        return Object.entries(schema.properties || {}).flatMap(([name, part]) => flattenSchema(part, spec, prefix ? prefix + '.' + name : name, depth + 1, seen));
    }
    if (schema.type === 'array') {
        return schema.items ? flattenSchema(schema.items, spec, prefix + '[]', depth + 1, seen) : [];
    }
    if (!prefix)
        return [];
    const type = Array.isArray(schema.type) ? schema.type.find((x) => x !== 'null') : schema.type;
    const kind = schema.enum ? 'choice' : type === 'integer' || type === 'number' ? 'number' : type === 'boolean' ? 'boolean' : schema.format === 'date' ? 'date' : 'text';
    return [{ path: prefix, kind, options: Array.isArray(schema.enum) ? schema.enum.map(String) : undefined }];
}
function parseOpenAPI(raw) {
    var _a, _b, _c;
    let spec;
    try {
        spec = JSON.parse(raw);
    }
    catch (e) {
        throw Error('JSON inválido: ' + e.message);
    }
    if (!String(spec.openapi || '').startsWith('3.'))
        throw Error('Esperado OpenAPI 3.x JSON. Swagger 2, YAML e JSON Schema puro não são compatíveis com este protótipo.');
    const operations = [];
    let gets = 0;
    const warnings = [];
    for (const [path, route] of Object.entries(spec.paths || {})) {
        const op = route === null || route === void 0 ? void 0 : route.get;
        if (!op)
            continue;
        gets++;
        try {
            const responses = Object.entries(op.responses || {}).sort(([a], [b]) => Number(a) - Number(b));
            const responseEntry = responses.find(([status]) => /^2\d\d$/.test(status)) || responses.find(([status]) => status === 'default');
            let response = responseEntry === null || responseEntry === void 0 ? void 0 : responseEntry[1];
            if (response === null || response === void 0 ? void 0 : response.$ref)
                response = resolveLocalRef(spec, response.$ref);
            const content = (response === null || response === void 0 ? void 0 : response.content) || {};
            const jsonEntry = Object.entries(content).find(([type]) => type === 'application/json') || Object.entries(content).find(([type]) => type.includes('+json'));
            const media = jsonEntry === null || jsonEntry === void 0 ? void 0 : jsonEntry[1];
            const schema = media === null || media === void 0 ? void 0 : media.schema;
            if (!schema) {
                warnings.push('GET ' + path + ': sem schema de resposta JSON');
                continue;
            }
            const fields = flattenSchema(schema, spec);
            if (!fields.length) {
                warnings.push('GET ' + path + ': resposta sem campos escalares detectáveis');
                continue;
            }
            const pathParams = (path.match(/\{([^}]+)\}/g) || []).map((n) => n.slice(1, -1));
            operations.push({ key: 'GET ' + path, method: 'GET', path, summary: op.summary || op.operationId || 'Read resource', pathParams, fields });
        }
        catch (e) {
            warnings.push('GET ' + path + ': ' + e.message);
        }
    }
    if (!operations.length)
        throw Error(gets === 0 ? 'Nenhuma operação GET encontrada no contrato. Configure uma operação de leitura para resolver contexto.' : `Foram encontradas ${gets} operações GET, mas nenhuma com campos JSON utilizáveis. ${warnings.slice(0, 3).join(' | ')}`);
    const baseUrl = String(((_b = (_a = spec.servers) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || '');
    return { source: { id: 'src-' + Date.now().toString(36), name: String(((_c = spec.info) === null || _c === void 0 ? void 0 : _c.title) || 'Imported API'), baseUrl, operations, spec, mode: 'schema-only' } };
}
function pickJSONPath(payload, path) { return path.split('.').reduce((value, k) => value === null || value === void 0 ? void 0 : value[k], payload); }
const ruleKey = (agentId, toolId) => agentId + '::' + toolId;
const initialPolicies = {
    [ruleKey('engineering', 'pull_requests.merge')]: { mode: 'all', clauses: [{ id: 'seed-1', attrId: 'arguments.target_branch', operator: 'neq', value: 'main' }] },
    [ruleKey('support', 'tickets.reply')]: { mode: 'all', clauses: [{ id: 'seed-2', attrId: 'arguments.visibility', operator: 'neq', value: 'Public' }] },
};
function permittedOperators(kind) {
    const equality = [{ id: 'eq', label: 'is' }, { id: 'neq', label: 'is not' }];
    if (kind === 'number' || kind === 'date')
        return equality.concat([{ id: 'gt', label: 'greater than' }, { id: 'gte', label: 'at least' }, { id: 'lt', label: 'less than' }, { id: 'lte', label: 'at most' }]);
    if (kind === 'text')
        return equality.concat([{ id: 'contains', label: 'contains' }, { id: 'notcontains', label: 'does not contain' }]);
    return equality;
}
function evaluateClause(actual, clause, attribute) {
    if (actual === undefined || actual === null || String(actual).trim() === '')
        return false;
    const right = clause.value;
    if (right.trim() === '')
        return false;
    if (attribute.kind === 'number') {
        if (!Number.isFinite(Number(actual)) || !Number.isFinite(Number(right)))
            return false;
        const left = Number(actual), value = Number(right);
        return clause.operator === 'eq' ? left === value : clause.operator === 'neq' ? left !== value : clause.operator === 'gt' ? left > value : clause.operator === 'gte' ? left >= value : clause.operator === 'lt' ? left < value : clause.operator === 'lte' ? left <= value : false;
    }
    if (attribute.kind === 'date') {
        const left = Date.parse(String(actual)), value = Date.parse(right);
        if (!Number.isFinite(left) || !Number.isFinite(value))
            return false;
        return clause.operator === 'eq' ? left === value : clause.operator === 'neq' ? left !== value : clause.operator === 'gt' ? left > value : clause.operator === 'gte' ? left >= value : clause.operator === 'lt' ? left < value : clause.operator === 'lte' ? left <= value : false;
    }
    const left = String(actual).toLowerCase(), value = right.toLowerCase();
    return clause.operator === 'eq' ? left === value : clause.operator === 'neq' ? left !== value : clause.operator === 'contains' ? left.includes(value) : clause.operator === 'notcontains' ? !left.includes(value) : false;
}
function policyClone(policy) { return policy ? JSON.parse(JSON.stringify(policy)) : { mode: 'all', clauses: [] }; }
const celVar = (a) => a.id.replace(/[^a-zA-Z0-9_]/g, '_');
const celKind = (a) => a.kind === 'number' ? 'number' : a.kind === 'boolean' ? 'boolean' : 'string';
const celParamType = (a) => a.kind === 'number' ? 'double' : a.kind === 'boolean' ? 'bool' : 'string';
const celLit = (v, a) => a.kind === 'number' && Number.isFinite(Number(v)) && v.trim() !== '' ? String(Number(v)) : a.kind === 'boolean' ? (v === 'true' ? 'true' : 'false') : JSON.stringify(v);
function clausesToCel(p, attrs) {
    if (!p.clauses.length)
        return 'true';
    return p.clauses.map(c => {
        const a = attrs.find(x => x.id === c.attrId);
        if (!a)
            return 'false';
        const field = celVar(a), lit = celLit(c.value, a);
        if (c.operator === 'contains')
            return `${field}.contains(${lit})`;
        if (c.operator === 'notcontains')
            return `!${field}.contains(${lit})`;
        const op = { eq: '==', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=' };
        return `${field} ${op[c.operator] || '=='} ${lit}`;
    }).map(exp => `(${exp})`).join(p.mode === 'any' ? ' || ' : ' && ');
}
function lexCel(text) {
    const tokens = [];
    let i = 0;
    while (i < text.length) {
        const start = i, c = text[i];
        if (/\s/.test(c)) {
            i++;
            continue;
        }
        if (c === '"' || c === "'") {
            const quote = c;
            i++;
            let v = '';
            let closed = false;
            while (i < text.length) {
                if (text[i] === quote) {
                    i++;
                    closed = true;
                    break;
                }
                if (text[i] === '\\') {
                    i++;
                    if (i >= text.length)
                        throw new Error('Unfinished string escape at ' + (start + 1));
                    const n = text[i++];
                    v += n === 'n' ? '\n' : n === 't' ? '\t' : n === 'r' ? '\r' : n;
                }
                else
                    v += text[i++];
            }
            if (!closed)
                throw new Error('Unterminated string at ' + (start + 1));
            tokens.push({ tag: 'string', value: v, at: start });
            continue;
        }
        const num = text.slice(i).match(/^(?:\d+(?:\.\d+)?)/);
        if (num) {
            tokens.push({ tag: 'number', value: num[0], at: start });
            i += num[0].length;
            continue;
        }
        const id = text.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
        if (id) {
            tokens.push({ tag: { true: 'boolean', false: 'boolean', in: 'op' }[id[0]] || 'id', value: id[0], at: start });
            i += id[0].length;
            continue;
        }
        const op = ['&&', '||', '==', '!=', '>=', '<='].find(x => text.startsWith(x, i));
        if (op) {
            tokens.push({ tag: 'op', value: op, at: start });
            i += op.length;
            continue;
        }
        if ('()!,<>.[]'.includes(c)) {
            tokens.push({ tag: 'op', value: c, at: start });
            i++;
            continue;
        }
        throw new Error(`Unexpected character '${c}' at column ${start + 1}`);
    }
    tokens.push({ tag: 'end', value: '', at: text.length });
    return tokens;
}
function parseCel(text) {
    const tokens = lexCel(text);
    let idx = 0;
    const peek = () => tokens[idx], consume = () => tokens[idx++];
    const take = (op) => peek().value === op ? (consume(), true) : false;
    const expect = (op) => { if (!take(op))
        throw new Error(`Expected '${op}' at column ${peek().at + 1}`); };
    const error = (message) => { throw new Error(message + ' at column ' + (peek().at + 1)); };
    const node = (tag, at, other = {}) => ({ tag, at, ...other });
    function primary() {
        const t = consume();
        let n;
        if (t.value === '(') {
            n = or();
            expect(')');
        }
        else if (t.tag === 'number')
            n = node('literal', t.at, { value: Number(t.value) });
        else if (t.tag === 'string')
            n = node('literal', t.at, { value: t.value });
        else if (t.tag === 'boolean')
            n = node('literal', t.at, { value: t.value === 'true' });
        else if (t.tag === 'id')
            n = node('var', t.at, { value: t.value });
        else if (t.value === '[') {
            const args = [];
            if (!take(']')) {
                do {
                    args.push(or());
                } while (take(','));
                expect(']');
            }
            n = node('list', t.at, { args });
        }
        else
            throw new Error(`Expected value at column ${t.at + 1}`);
        while (take('.')) {
            const m = consume();
            if (m.tag !== 'id' || !['contains', 'startsWith', 'endsWith'].includes(m.value))
                throw new Error(`Unsupported method at column ${m.at + 1}`);
            expect('(');
            const arg = or();
            expect(')');
            n = node('method', m.at, { left: n, op: m.value, right: arg });
        }
        return n;
    }
    function unary() { if (peek().value === '!') {
        const t = consume();
        return node('unary', t.at, { op: '!', left: unary() });
    } return primary(); }
    function compare() { let n = unary(); while (['<', '<=', '>', '>=', 'in'].includes(peek().value)) {
        const t = consume();
        n = node('binary', t.at, { op: t.value, left: n, right: unary() });
    } return n; }
    function equality() { let n = compare(); while (['==', '!='].includes(peek().value)) {
        const t = consume();
        n = node('binary', t.at, { op: t.value, left: n, right: compare() });
    } return n; }
    function and() { let n = equality(); while (peek().value === '&&') {
        const t = consume();
        n = node('binary', t.at, { op: '&&', left: n, right: equality() });
    } return n; }
    function or() { let n = and(); while (peek().value === '||') {
        const t = consume();
        n = node('binary', t.at, { op: '||', left: n, right: and() });
    } return n; }
    if (peek().tag === 'end')
        error('Expression is empty');
    const result = or();
    if (peek().tag !== 'end')
        error('Unexpected token ' + peek().value);
    return result;
}
function typeCel(n, attrs) {
    const fail = (msg) => { throw new Error(msg + ' at column ' + (n.at + 1)); };
    if (n.tag === 'literal')
        return typeof n.value;
    if (n.tag === 'var') {
        const a = attrs.find(x => celVar(x) === n.value);
        if (!a)
            return fail(`Unknown attribute '${n.value}'. Define it in the attribute catalog`);
        return celKind(a);
    }
    if (n.tag === 'list') {
        const types = (n.args || []).map(x => typeCel(x, attrs));
        if (types.length && types.some(t => t !== types[0]))
            return fail('List elements must have the same type');
        return `list:${types[0] || 'unknown'}`;
    }
    if (n.tag === 'unary') {
        if (typeCel(n.left, attrs) !== 'boolean')
            return fail('! expects a boolean');
        return 'boolean';
    }
    if (n.tag === 'method') {
        if (typeCel(n.left, attrs) !== 'string' || typeCel(n.right, attrs) !== 'string')
            return fail(`${n.op} expects string arguments`);
        return 'boolean';
    }
    if (n.tag === 'binary') {
        const l = typeCel(n.left, attrs), r = typeCel(n.right, attrs);
        if (['&&', '||'].includes(n.op)) {
            if (l !== 'boolean' || r !== 'boolean')
                return fail(`${n.op} expects boolean expressions`);
            return 'boolean';
        }
        if (n.op === 'in') {
            if (!r.startsWith('list:') || r.slice(5) !== l)
                return fail('in expects a list of the same type');
            return 'boolean';
        }
        if (l !== r)
            return fail(`Type mismatch: ${l} vs ${r}`);
        if (['<', '<=', '>', '>='].includes(n.op) && l !== 'number' && l !== 'string')
            return fail(`${n.op} expects ordered values`);
        return 'boolean';
    }
    return fail('Unsupported CEL node');
}
function compileCel(text, attrs) {
    try {
        const ast = parseCel(text);
        if (typeCel(ast, attrs) !== 'boolean')
            throw new Error('The expression must return true or false');
        const names = new Set();
        const walk = (n) => { if (n.tag === 'var')
            names.add(n.value); if (n.left)
            walk(n.left); if (n.right)
            walk(n.right); (n.args || []).forEach(walk); };
        walk(ast);
        return { ok: true, ast, used: attrs.filter(a => names.has(celVar(a))) };
    }
    catch (e) {
        return { ok: false, error: e.message || 'Invalid expression' };
    }
}
function evalCel(n, values) {
    if (n.tag === 'literal')
        return n.value;
    if (n.tag === 'var') {
        if (!Object.prototype.hasOwnProperty.call(values, n.value))
            throw new Error('Missing value for ' + n.value);
        return values[n.value];
    }
    if (n.tag === 'list')
        return (n.args || []).map(x => evalCel(x, values));
    if (n.tag === 'unary')
        return !evalCel(n.left, values);
    if (n.tag === 'method') {
        const l = evalCel(n.left, values), r = evalCel(n.right, values);
        if (typeof l !== 'string' || typeof r !== 'string')
            throw new Error('Method expected strings');
        return n.op === 'contains' ? l.includes(r) : n.op === 'startsWith' ? l.startsWith(r) : l.endsWith(r);
    }
    if (n.tag === 'binary') {
        if (n.op === '&&') {
            const l = evalCel(n.left, values);
            return l && evalCel(n.right, values);
        }
        if (n.op === '||') {
            const l = evalCel(n.left, values);
            return l || evalCel(n.right, values);
        }
        const l = evalCel(n.left, values), r = evalCel(n.right, values);
        return n.op === '==' ? l === r : n.op === '!=' ? l !== r : n.op === '>' ? l > r : n.op === '>=' ? l >= r : n.op === '<' ? l < r : n.op === '<=' ? l <= r : n.op === 'in' ? r.includes(l) : false;
    }
    throw new Error('Invalid expression');
}
function celInputValue(a, value) {
    if (value === undefined || value === null || String(value).trim() === '')
        throw new Error('Missing trusted context: ' + a.label);
    if (a.kind === 'number') {
        const v = Number(value);
        if (!Number.isFinite(v))
            throw new Error('Expected number for ' + a.label);
        return v;
    }
    if (a.kind === 'boolean') {
        if (value !== true && value !== false && value !== 'true' && value !== 'false')
            throw new Error('Expected boolean for ' + a.label);
        return value === true || value === 'true';
    }
    return String(value);
}
// Restrict reverse conversion to a lossless subset; advanced CEL remains editable only in raw mode.
function celToClauses(expression, attrs) {
    var _a;
    const compiled = compileCel(expression, attrs);
    if (!compiled.ok || !compiled.ast)
        return null;
    if (compiled.ast.tag === 'literal' && compiled.ast.value === true)
        return { mode: 'all', clauses: [], editor: 'visual' };
    const pieces = [];
    let join = '';
    const split = (n) => {
        if (n.tag === 'binary' && (n.op === '&&' || n.op === '||')) {
            if (join && join !== n.op)
                return false;
            join = n.op;
            return split(n.left) && split(n.right);
        }
        pieces.push(n);
        return true;
    };
    if (!split(compiled.ast))
        return null;
    const clauses = [];
    for (const n of pieces) {
        let field, value, operator = '';
        if (n.tag === 'binary' && ['==', '!=', '>', '>=', '<', '<='].includes(n.op)) {
            field = n.left;
            value = n.right;
            operator = { '==': 'eq', '!=': 'neq', '>': 'gt', '>=': 'gte', '<': 'lt', '<=': 'lte' }[n.op];
        }
        else if (n.tag === 'method' && n.op === 'contains') {
            field = n.left;
            value = n.right;
            operator = 'contains';
        }
        else if (n.tag === 'unary' && ((_a = n.left) === null || _a === void 0 ? void 0 : _a.tag) === 'method' && n.left.op === 'contains') {
            field = n.left.left;
            value = n.left.right;
            operator = 'notcontains';
        }
        else
            return null;
        if ((field === null || field === void 0 ? void 0 : field.tag) !== 'var' || (value === null || value === void 0 ? void 0 : value.tag) !== 'literal')
            return null;
        const attr = attrs.find(a => celVar(a) === field.value);
        if (!attr || !permittedOperators(attr.kind).some(o => o.id === operator))
            return null;
        const valueString = String(value.value);
        clauses.push({ id: 'raw-to-visual-' + clauses.length, attrId: attr.id, operator, value: valueString });
    }
    return { mode: join === '||' ? 'any' : 'all', clauses, editor: 'visual' };
}
function policyCel(p, attrs) { return p.editor === 'raw' ? p.raw || '' : clausesToCel(p, attrs); }
function checkPolicy(p, attrs) { return p ? compileCel(policyCel(p, attrs), attrs) : compileCel('true', attrs); }
const svgPaths = {
    'help': React.createElement("g", null,
        React.createElement("circle", { cx: "12", cy: "12", r: "9" }),
        React.createElement("path", { d: "M9.7 9a2.4 2.4 0 1 1 4.3 1.5c-.9 1-2 1.2-2 3" }),
        React.createElement("path", { d: "M12 17h.01" })),
    'search': React.createElement("g", null,
        React.createElement("circle", { cx: "10.8", cy: "10.8", r: "6.5" }),
        React.createElement("path", { d: "m16 16 4.5 4.5" })),
    'chevron': React.createElement("path", { d: "m9 18 6-6-6-6" }),
    'down': React.createElement("path", { d: "m6 9 6 6 6-6" }),
    'arrow': React.createElement("path", { d: "M5 12h14m-6-6 6 6-6 6" }),
    'bolt': React.createElement("path", { d: "m13 2-9 11h7l-1 9 10-12h-7z" }),
    'check': React.createElement("path", { d: "m5 12 4 4L19 6" }),
    'x': React.createElement("path", { d: "M18 6 6 18M6 6l12 12" }),
    'plus': React.createElement("path", { d: "M12 5v14M5 12h14" }),
    'close': React.createElement("path", { d: "M18 6 6 18M6 6l12 12" }),
    'link': React.createElement("g", null,
        React.createElement("path", { d: "M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.6 1.6" }),
        React.createElement("path", { d: "M14 11a5 5 0 0 0-7.1 0l-3 3a5 5 0 1 0 7.1 7.1l1.6-1.6" })),
    'shield': React.createElement("path", { d: "m12 22 8-4V6l-8-4-8 4v12z" }),
    'beaker': React.createElement("g", null,
        React.createElement("path", { d: "M9 3h6m-5 0v7l-6 9a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3l-6-9V3" }),
        React.createElement("path", { d: "M7 16h10" })),
    'filter': React.createElement("path", { d: "M4 7h16M7 12h10m-7 5h4" }),
    'square': React.createElement("g", null,
        React.createElement("rect", { x: "3.5", y: "3.5", width: "17", height: "17", rx: "4" }),
        React.createElement("path", { d: "M9 12h6m-3-3v6" })),
    'layers': React.createElement("g", null,
        React.createElement("path", { d: "m12 3 9 5-9 5-9-5 9-5Z" }),
        React.createElement("path", { d: "m3 12 9 5 9-5M3 16l9 5 9-5" })),
    'users': React.createElement("g", null,
        React.createElement("circle", { cx: "9", cy: "7", r: "3" }),
        React.createElement("path", { d: "M3.5 20v-3a5.5 5.5 0 0 1 11 0v3H3.5ZM17 4a3 3 0 0 1 0 6m3.5 10v-3a5.5 5.5 0 0 0-3.7-5.2" })),
    'server': React.createElement("g", null,
        React.createElement("rect", { x: "3", y: "3", width: "18", height: "8", rx: "2" }),
        React.createElement("rect", { x: "3", y: "13", width: "18", height: "8", rx: "2" }),
        React.createElement("path", { d: "M7 7h.01M7 17h.01" })),
    'terminal': React.createElement("g", null,
        React.createElement("rect", { x: "2.5", y: "3.5", width: "19", height: "17", rx: "3" }),
        React.createElement("path", { d: "m6 8 4 4-4 4m6 0h5" })),
    'clock': React.createElement("g", null,
        React.createElement("circle", { cx: "12", cy: "12", r: "9" }),
        React.createElement("path", { d: "M12 6v6l4 2" })),
    'edit': React.createElement("g", null,
        React.createElement("path", { d: "M4 19.5 8 19l11-11-3-3L5 16l-1 3.5Z" }),
        React.createElement("path", { d: "m14.5 6.5 3 3" })),
    'alert': React.createElement("g", null,
        React.createElement("path", { d: "m12 3 10 18H2z" }),
        React.createElement("path", { d: "M12 9v4m0 4v.1" })),
    'circlecheck': React.createElement("g", null,
        React.createElement("circle", { cx: "12", cy: "12", r: "9" }),
        React.createElement("path", { d: "m8 12 3 3 5-6" })),
    'trash': React.createElement("g", null,
        React.createElement("path", { d: "M4 7h16m-14 0 1 14h10l1-14M9 7V4h6v3" })),
    'code': React.createElement("g", null,
        React.createElement("path", { d: "m8 8-4 4 4 4m8-8 4 4-4 4m-3-12-2 16" })),
    'history': React.createElement("g", null,
        React.createElement("path", { d: "M3 12a9 9 0 1 0 3-6.7L3 8" }),
        React.createElement("path", { d: "M3 3v5h5M12 7v5l3 2" })),
    'eye': React.createElement("g", null,
        React.createElement("path", { d: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" }),
        React.createElement("circle", { cx: "12", cy: "12", r: "3" })),
    'command': React.createElement("g", null,
        React.createElement("path", { d: "M9 7V5a3 3 0 1 0-3 3h2v8H6a3 3 0 1 0 3 3v-2h6v2a3 3 0 1 0 3-3h-2V8h2a3 3 0 1 0-3-3v2H9Z" })),
    'zap': React.createElement("path", { d: "M13 2 4 13h7l-1 9 10-12h-7z" }),
    'settings': React.createElement("g", null,
        React.createElement("circle", { cx: "12", cy: "12", r: "3.2" }),
        React.createElement("path", { d: "m20 12 2-1-2-4-2 1-2-2 1-2-4-2-1 2-3 0-1-2-4 2 1 2-2 2-2-1-2 4 2 1 0 3-2 1 2 4 2-1 2 2-1 2 4 2 1-2 3 0 1 2 4-2-1-2 2-2 2 1 2-4-2-1Z" })),
};
function differs(tip) { return React.createElement("span", { className: "planned-tag planned-tag--differs", tabIndex: 0, "data-tip": tip }, "Differs \u00B7 2026-10-29"); }
function Icon(p) { return React.createElement("svg", { "aria-hidden": "true", className: p.className || '', width: p.size || 18, height: p.size || 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" }, svgPaths[p.name] || svgPaths.circlecheck); }
const initialTools = [
    { id: 'accounts.get_balance', server: 'Finance MCP', description: 'Read account balances', risk: 'read' },
    { id: 'accounts.list_transactions', server: 'Finance MCP', description: 'List transaction history', risk: 'read' },
    { id: 'payments.create', server: 'Finance MCP', description: 'Create a payment', risk: 'sensitive' },
    { id: 'payments.refund', server: 'Finance MCP', description: 'Refund a settled payment', risk: 'sensitive' },
    { id: 'payments.get', server: 'Finance MCP', description: 'Inspect payment status', risk: 'read' },
    { id: 'invoices.create', server: 'Finance MCP', description: 'Create an invoice', risk: 'write' },
    { id: 'customers.lookup', server: 'CRM MCP', description: 'Search customer records', risk: 'read' },
    { id: 'customers.update', server: 'CRM MCP', description: 'Update customer profile', risk: 'write' },
    { id: 'customers.delete', server: 'CRM MCP', description: 'Delete a customer', risk: 'sensitive' },
    { id: 'tickets.list', server: 'CRM MCP', description: 'List support tickets', risk: 'read' },
    { id: 'tickets.reply', server: 'CRM MCP', description: 'Reply to a ticket', risk: 'write' },
    { id: 'tickets.close', server: 'CRM MCP', description: 'Close a ticket', risk: 'write' },
    { id: 'repos.list', server: 'GitHub MCP', description: 'Find repositories', risk: 'read' },
    { id: 'issues.create', server: 'GitHub MCP', description: 'Create a GitHub issue', risk: 'write' },
    { id: 'pull_requests.merge', server: 'GitHub MCP', description: 'Merge a pull request', risk: 'sensitive' },
    { id: 'repos.delete', server: 'GitHub MCP', description: 'Delete a repository', risk: 'sensitive' },
    { id: 'files.search', server: 'Knowledge MCP', description: 'Search internal documents', risk: 'read' },
    { id: 'files.read', server: 'Knowledge MCP', description: 'Read a document', risk: 'read' },
    { id: 'files.share', server: 'Knowledge MCP', description: 'Create a share link', risk: 'sensitive' },
    { id: 'documents.export', server: 'Knowledge MCP', description: 'Export documents', risk: 'sensitive' },
    { id: 'crm.contacts.export', server: 'CRM MCP', description: 'Export all contact records', risk: 'sensitive', approved: false },
    { id: 'orders.get', server: 'Orders MCP', description: 'Read an order by ID', risk: 'read' },
    { id: 'orders.cancel', server: 'Orders MCP', description: 'Cancel an order', risk: 'sensitive' },
];
const firstAgents = [
    { id: 'finance', name: 'Finance Agent', description: 'Payments and account workflows', environment: 'production', status: 'active' },
    { id: 'support', name: 'Support Agent', description: 'Customer support and ticketing', environment: 'production', status: 'active' },
    { id: 'engineering', name: 'Engineering Agent', description: 'Repository and issue automation', environment: 'production', status: 'active' },
    { id: 'research', name: 'Research Agent', description: 'Internal document retrieval', environment: 'production', status: 'active' },
    { id: 'sales', name: 'Sales Assistant', description: 'CRM enrichment and outreach', environment: 'development', status: 'active' },
    { id: 'billing', name: 'Billing Agent', description: 'Invoice operations and reconciliation', environment: 'production', status: 'active' },
    { id: 'onboarding', name: 'Onboarding Agent', description: 'Provisioning and user education', environment: 'development', status: 'draft' },
    { id: 'orderops', name: 'Orders Agent', description: 'Order management and customer operations', environment: 'production', status: 'active' },
];
const extraNames = ['Retention', 'Procurement', 'Campaign', 'Reporting', 'Compliance', 'Recruiting', 'Operations', 'Data Quality', 'Inventory', 'Legal', 'Fraud Review', 'Customer Success', 'QA', 'Release', 'Analytics', 'Field Service', 'Knowledge', 'Product', 'Contract', 'Renewals', 'Forecasting', 'Incident', 'Platform', 'Content', 'Approval', 'Vendor', 'Risk', 'Training', 'Partner', 'Revenue', 'Workflow'];
const seedAgents = firstAgents.concat(extraNames.map((n, i) => ({ id: 'agent-' + i, name: n + ' Agent', description: ['Business workflows', 'Operational automation', 'Internal productivity'][i % 3], environment: i % 4 === 0 ? 'development' : 'production', status: i % 7 === 0 ? 'draft' : 'active' })));
const seedUsers = [
    { id: 'u1', name: 'João Almeida', email: 'joao@acme.dev', status: 'active', team: 'Finance' },
    { id: 'u2', name: 'Marina Costa', email: 'marina@acme.dev', status: 'active', team: 'Finance' },
    { id: 'u3', name: 'Lia Mendes', email: 'lia@acme.dev', status: 'active', team: 'Support' },
    { id: 'u4', name: 'Pedro Lima', email: 'pedro@acme.dev', status: 'active', team: 'Engineering' },
    { id: 'u5', name: 'Ana Ribeiro', email: 'ana@acme.dev', status: 'active', team: 'Operations' },
    { id: 'u6', name: 'Rafa Sousa', email: 'rafa@acme.dev', status: 'active', team: 'Engineering' },
    { id: 'u7', name: 'Camila Nunes', email: 'camila@acme.dev', status: 'active', team: 'Finance' },
    { id: 'u8', name: 'Lucas Oliveira', email: 'lucas@acme.dev', status: 'disabled', team: 'Support' },
    { id: 'u9', name: 'Bianca Ferreira', email: 'bianca@acme.dev', status: 'active', team: 'Sales' },
    { id: 'u10', name: 'Carlos Prado', email: 'carlos@acme.dev', status: 'active', team: 'Finance' },
    { id: 'u11', name: 'Nina Rocha', email: 'nina@acme.dev', status: 'active', team: 'Legal' },
];
const seedGranted = {
    finance: ['accounts.get_balance', 'accounts.list_transactions', 'payments.get', 'payments.create'],
    support: ['customers.lookup', 'tickets.list', 'tickets.reply', 'tickets.close'],
    engineering: ['repos.list', 'issues.create', 'pull_requests.merge'],
    research: ['files.search', 'files.read'],
    sales: ['customers.lookup', 'tickets.list'],
    billing: ['accounts.get_balance', 'payments.get', 'invoices.create'],
    onboarding: ['files.search', 'files.read'], orderops: ['orders.get', 'orders.cancel'],
};
const seedMembers = {
    finance: ['u1', 'u2', 'u7', 'u10'], support: ['u3', 'u8'], engineering: ['u4', 'u6'], research: ['u2', 'u4', 'u5'], sales: ['u9'], billing: ['u1', 'u7'], onboarding: ['u5'], orderops: ['u5'],
};
const seedDecisions = [
    { id: 'dec_8e04', time: '09:25:07', agentId: 'finance', userId: 'u2', toolId: 'payments.refund', result: false, reason: 'Capability not granted', context: { 'arguments.amount': '1200', 'arguments.currency': 'USD' } },
    { id: 'dec_8e03', time: '09:24:16', agentId: 'finance', userId: 'u1', toolId: 'payments.refund', result: false, reason: 'Capability not granted', context: { 'arguments.amount': '450', 'arguments.currency': 'USD' } },
    { id: 'dec_8e02', time: '09:23:58', agentId: 'finance', userId: 'u1', toolId: 'payments.create', result: true, reason: 'Granted by Finance Agent', context: { 'arguments.amount': '80', 'arguments.currency': 'USD' } },
    { id: 'dec_8e01', time: '09:22:41', agentId: 'support', userId: 'u3', toolId: 'customers.delete', result: false, reason: 'Capability not granted' },
    { id: 'dec_8d99', time: '09:20:14', agentId: 'engineering', userId: 'u4', toolId: 'issues.create', result: true, reason: 'Granted by Engineering Agent' },
    { id: 'dec_8d98', time: '09:19:10', agentId: 'research', userId: 'u5', toolId: 'files.search', result: true, reason: 'Granted by Research Agent' },
    { id: 'dec_8d97', time: '09:17:33', agentId: 'support', userId: 'u3', toolId: 'payments.refund', result: false, reason: 'Capability not granted' },
    { id: 'dec_8d96', time: '09:16:42', agentId: 'engineering', userId: 'u4', toolId: 'pull_requests.merge', result: false, reason: 'Insufficient approved reviews', kind: 'condition', context: { 'arguments.approvals': '1', 'arguments.target_branch': 'release' } },
    { id: 'dec_8d95', time: '09:14:22', agentId: 'support', userId: 'u3', toolId: 'tickets.reply', result: true, reason: 'Granted by Support Agent', context: { 'arguments.visibility': 'Internal' } },
    { id: 'dec_8d94', time: '09:12:10', agentId: 'engineering', userId: 'u6', toolId: 'repos.delete', result: false, reason: 'Tool not reviewed', kind: 'tool_not_reviewed' },
    { id: 'dec_8d93', time: '09:10:44', agentId: 'support', userId: 'u8', toolId: 'tickets.reply', result: false, reason: 'User disabled in IdP', kind: 'user_disabled' },
];
const groupServers = ['Finance MCP', 'CRM MCP', 'GitHub MCP', 'Knowledge MCP', 'Orders MCP'];
const lsKey = 'chokepoint-workbench-demo-v4-context-sources';
const oldLsKey = 'chokepoint-workbench-demo-v2';
function readCache() { try {
    return JSON.parse(localStorage.getItem(lsKey) || localStorage.getItem(oldLsKey) || 'null');
}
catch (e) {
    return null;
} }
function storeCache(data) { try {
    localStorage.setItem(lsKey, JSON.stringify(data));
}
catch (e) { } }
function nice(t) { return t.replace(/_/g, ' ').replace(/\./g, ' / '); }
function initials(s) { return s.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase(); }
function plural(n, singular, pluralName) { return n + ' ' + (n === 1 ? singular : pluralName); }
function classNames(...v) { return v.filter(Boolean).join(' '); }
const HELP_TOPICS = {
    overview: { title: 'Overview', body: 'Mostra tarefas operacionais que exigem intervenção, não apenas contadores.', details: ['Alertas desta demonstração são simulados.', 'Use Review, Investigate e Access para agir sobre o problema.'] },
    access: { title: 'Access workbench', body: 'Administra a relação entre usuários, tipos de agente e capacidades. OpenFGA modela as relações; o Chokepoint aplica restrições contextuais adicionais.', details: ['Concessões são preparadas antes de publicar.', 'Ferramentas podem exigir contexto adicional de fontes confiáveis.'] },
    investigate: { title: 'Investigar decisões', body: 'Reproduz o motivo de um ALLOW ou DENY com relações e condições conhecidas.', details: ['Os resultados atuais são dados de demonstração.', 'Em produção, atributos externos devem ser preservados com rastreabilidade e controles de privacidade.'] },
    mcp: { title: 'MCP tools/list', body: 'O inputSchema das tools descreve argumentos enviados em tools/call; não prova fatos sobre recursos externos.', details: ['É necessário poder acessar tools/list com autenticação apropriada.', 'Argumentos não equivalem a dados confiáveis do GitHub ou de outras APIs.'] },
    idpclaims: { title: 'Claims da identidade', body: 'Somente claims que o IdP entrega e cuja autenticidade foi validada ficam disponíveis para condições.', details: ['A seleção no protótipo é um allowlist de campos, não sincronização real com o IdP.', 'Os valores de claims precisam vir do token validado ou da fonte de identidade integrada.'] },
    agentcontext: { title: 'Contexto do agente', body: 'Campos como tipo de agente, ambiente e status são provenientes do registro lógico do Chokepoint.', details: ['O registro do tipo não comprova a identidade do processo que está executando o agente.', 'Em produção, associe o agente a uma identidade autenticada de workload.'] },
    gatewaycontext: { title: 'Contexto do PEP', body: 'Fatos da chamada interceptada pelo gateway/SDK: operação, origem da requisição e argumentos.', details: ['São observações da fronteira de execução, não confirmação de fatos sobre recursos externos.', 'Sem PEP efetivo, nenhuma autorização impede a chamada direta à tool.'] },
    identity: { title: 'Identity, agent registry e gateway', body: 'São três fontes diferentes: o IdP valida usuários/claims; o Agent Registry mantém o cadastro lógico do tipo de agente; o PEP/Gateway observa a requisição e argumentos MCP.', details: ['Um Agent Registry não prova sozinho a identidade criptográfica de um workload.', 'O PEP fornece apenas dados autenticados/observados.', 'Neste protótipo esses dados são fixtures locais, não uma sincronização real.'] },
    openapi: { title: 'OpenAPI Context Provider', body: 'Importe OpenAPI 3.x JSON, escolha uma operação GET e mapeie um campo da resposta para condições de uma tool.', details: ['O schema declara campos e tipos, mas não garante sua procedência.', 'O backend Context Resolver precisará autenticar e consultar o endpoint em execução.', 'Importar por URL neste protótipo exige CORS permitido pelo servidor e HTTPS.'] },
    sources: { title: 'Context Sources', body: 'Catálogo de origens de atributos que podem ser utilizados na avaliação de políticas.', details: ['MCP: argumentos do request.', 'Identity/Agent: identidade validada e contexto do runtime.', 'OpenAPI: leitura externa configurada.', 'Nenhum dado remoto é consultado durante as simulações deste frontend.'] },
    import: { title: 'Importar contrato OpenAPI', body: 'O botão Inspect schema interpreta o JSON e lista operações GET e os campos de resposta compatíveis.', details: ['Upload aceita JSON local; URL baixa JSON em endpoint público que permita CORS.', 'A importação não executa a API do negócio.', 'Apenas operações GET com response schema JSON tipado são reconhecidas nesta versão.'] },
    bindings: { title: 'Context bindings', body: 'Cada binding liga uma tool protegida a uma operação de leitura de uma fonte e a um campo de resposta.', details: ['Exemplo: orders.cancel usa GET /orders/{id}, com id vindo de arguments.order_id; campo status.', 'O binding descreve como resolver o valor no backend, mas ainda não realiza a consulta HTTP nesta demonstração.', 'Remover um binding pode invalidar políticas que usam seu atributo.'] },
    extraction: { title: 'Teste de extração', body: 'Usa uma resposta JSON colada para verificar se o caminho do campo realmente existe.', details: ['Não autentica nem chama a API externa.', 'Não equivale a um teste de decisão OpenFGA.'] },
    scope: { title: 'Escopo de aplicação', body: 'Define a quem se aplica a restrição: agente, tool, usuário, equipe ou combinações.', details: ['Uma regra não concede acesso por si só.', 'Restrições aplicáveis são compostas com AND no protótipo.', 'Esta composição requer implementação explícita na integração com OpenFGA.'] },
    conditions: { title: 'Condições CEL', body: 'Compara valores tipados trazidos pelo gateway, identidade ou Context Resolver.', details: ['Modo visual gera expressões simples.', 'Modo CEL permite regras mais complexas.', 'A validação real precisa ocorrer no compilador CEL do backend/OpenFGA.'] },
    catalog: { title: 'Catálogo', body: 'Encontre usuários, tools e recursos e navegue para a ação de gerenciamento adequada.', details: ['Listas locais são demonstrativas; em produção devem suportar paginação e filtros server-side.'] },
    audit: { title: 'Auditoria', body: 'Histórico de mudanças de política, associação, revogação e decisões.', details: ['Os eventos precisam preservar actor, motivo, origem e versão de política no backend.'] },
    regression: { title: 'Authorization regression tests', body: 'Save an expected ALLOW or DENY for a concrete user, agent, tool and test context.', details: ['Regression tests are stored locally in the demo.', 'Publishing runs all saved tests against draft permissions and policies, and blocks known regressions.', 'In production the suite should use a versioned policy snapshot and typed trusted fixtures; historical reality is not reproduced automatically.'] },
    sandbox: { title: 'Evaluation lab', body: 'Simula o efeito conjunto de relações e condições para usuário, agente e tool.', details: ['Valores do contexto externo são fornecidos manualmente nesta demonstração.', 'O backend precisa resolver os atributos antes do OpenFGA Check.'] },
    experimental: { title: 'OpenFGA Dynamic Conditions — experimental', body: 'Expressões CEL inline associadas às relações do OpenFGA; a disponibilidade e sintaxe podem mudar.', details: ['Precisa ser habilitado explicitamente no servidor.', 'Não descobre atributos; apenas avalia os parâmetros entregues.', 'Mantenha adaptadores versionados e testes de compatibilidade.'] }
};
class App extends React.Component {
    constructor(props) {
        var _a, _b;
        var _c, _d;
        super(props);
        this.remember = () => storeCache({ agents: this.state.agents, granted: this.state.granted, members: this.state.members, decisions: this.state.decisions, issues: this.state.issues, reviewed: this.state.reviewed, history: this.state.history, policies: this.state.policies, sources: this.state.sources, bindings: this.state.bindings, tools: this.state.tools, customToolAttributes: toolAttributeSeeds, idpClaimSelection: this.state.idpClaimSelection, accessTests: this.state.accessTests });
        this.hotkeys = (e) => { const tgt = e.target; if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            this.setState({ paletteOpen: !this.state.paletteOpen, search: '' });
            return;
        } if (e.key === 'Escape') {
            this.setState({ paletteOpen: false, modal: '', pendingView: false, helpTopic: '' });
        } if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tgt.tagName)) {
            e.preventDefault();
            this.setState({ paletteOpen: true, search: '' });
        } };
        this.toast = (t) => { this.setState({ toast: t }); };
        this.go = (page, extra = {}) => { this.setState({ page, paletteOpen: false, modal: '', focusTool: '', ...(page === 'investigate' ? { decisionOpen: !!extra.selectedDecision } : {}), ...extra }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
        this.findAgent = (id) => this.state.agents.find((x) => x.id === id) || this.state.agents[0];
        this.findUser = (id) => this.state.users.find((x) => x.id === id) || this.state.users[0];
        this.findTool = (id) => this.state.tools.find((x) => x.id === id) || this.state.tools[0];
        this.base = (kind, agentId, targetId) => kind === 'capability' ? (this.state.granted[agentId] || []).includes(targetId) : (this.state.members[agentId] || []).includes(targetId);
        this.has = (kind, agentId, targetId, draft = true) => { const staged = draft ? this.state.pending.find((x) => x.kind === kind && x.agentId === agentId && x.targetId === targetId) : null; return staged ? staged.after : this.base(kind, agentId, targetId); };
        this.stage = (kind, agentId, targetId, desired) => { const before = this.base(kind, agentId, targetId); const after = desired !== undefined ? desired : !this.has(kind, agentId, targetId); this.setState((s) => ({ pending: s.pending.filter((x) => !(x.kind === kind && x.agentId === agentId && x.targetId === targetId)).concat(after === before ? [] : [{ kind, agentId, targetId, before, after }]) })); };
        this.publish = () => { const { pending, policyDrafts } = this.state; const policyKeys = Object.keys(policyDrafts); if (!pending.length && !policyKeys.length)
            return; const regressions = this.state.accessTests.map(t => ({ t, actual: this.evaluate(t.userId, t.agentId, t.toolId, t.values, true).allowed })); if (regressions.some(x => x.actual !== x.t.expected)) {
            this.setState({ pendingView: false, testSuiteResult: { draft: true, results: regressions.map(x => ({ ...x.t, actual: x.actual, pass: x.actual === x.t.expected })), passed: regressions.filter(x => x.actual === x.t.expected).length, failed: regressions.filter(x => x.actual !== x.t.expected).length }, toast: 'Publish blocked: authorization regression tests failed.' });
            return;
        } const errors = policyKeys.map(k => ({ k, check: checkPolicy(policyDrafts[k], this.attributesForScope(parseScopeKey(k))) })).filter(x => !x.check.ok); if (errors.length) {
            this.toast('Cannot publish: fix invalid CEL conditions first.');
            return;
        } const grant = { ...this.state.granted }, members = { ...this.state.members }; pending.forEach((c) => { const o = c.kind === 'capability' ? grant : members; const old = o[c.agentId] || []; o[c.agentId] = c.after ? Array.from(new Set(old.concat(c.targetId))) : old.filter((t) => t !== c.targetId); }); const policies = { ...this.state.policies }; policyKeys.forEach(k => { var _a; const policy = policyDrafts[k]; if (policy && (policy.editor === 'raw' ? !!((_a = policy.raw) === null || _a === void 0 ? void 0 : _a.trim()) : policy.clauses.length > 0))
            policies[k] = policy;
        else
            delete policies[k]; }); this.setState((s) => ({ granted: grant, members, policies, policyDrafts: {}, pending: [], pendingView: false, history: [{ description: 'Access policies published', detail: (pending.length + policyKeys.length) + ' changes · ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), time: 'Now' }].concat(s.history), toast: (pending.length + policyKeys.length) + ' changes published' })); };
        this.attributes = (toolId) => attributeCatalog(toolId, this.state.bindings, this.state.sources);
        this.attributesForScope = (t) => !hasTool(t.scope) ? sharedAttributes : this.attributes(t.toolId);
        this.scopeTarget = () => ({ scope: this.state.conditionScope, agentId: this.state.conditionAgent, toolId: this.state.conditionTool, userId: this.state.conditionUser, team: this.state.conditionTeam });
        this.scopedPolicy = (t, draft = true) => { const k = scopeKey(t); return draft && Object.prototype.hasOwnProperty.call(this.state.policyDrafts, k) ? this.state.policyDrafts[k] : (this.state.policies[k] || null); };
        this.policy = (agentId, toolId, draft = true) => this.scopedPolicy({ scope: 'agent_tool', agentId, toolId, userId: '', team: '' }, draft);
        this.applicableRules = (agentId, userId, toolId, draft = true) => {
            const user = this.findUser(userId), all = { ...this.state.policies, ...(draft ? this.state.policyDrafts : {}) };
            return Object.entries(all).filter(([key, policy]) => policy !== null && key.startsWith('scope|') && matchesScope(parseScopeKey(key), agentId, user, toolId)).map(([key, policy]) => ({ key, target: parseScopeKey(key), policy }));
        };
        this.scopeSummary = (target) => {
            var _a, _b;
            const agent = hasAgent(target.scope) ? (_a = this.findAgent(target.agentId)) === null || _a === void 0 ? void 0 : _a.name : 'Any authorized agent';
            const tool = hasTool(target.scope) ? target.toolId : 'Every granted tool';
            const who = hasUser(target.scope) ? (_b = this.findUser(target.userId)) === null || _b === void 0 ? void 0 : _b.name : hasTeam(target.scope) ? 'Team: ' + target.team : 'Any authorized user';
            return `${agent} · ${tool} · ${who}`;
        };
        this.scopeImpact = (target) => {
            const agents = this.state.agents.filter((a) => !hasAgent(target.scope) || a.id === target.agentId);
            const tools = this.state.tools.filter((tool) => !hasTool(target.scope) || tool.id === target.toolId);
            const affected = new Set();
            let pairs = 0;
            for (const agent of agents)
                for (const tool of tools) {
                    if (!this.has('capability', agent.id, tool.id))
                        continue;
                    pairs++;
                    for (const u of this.state.users) {
                        if (this.has('member', agent.id, u.id) && matchesScope(target, agent.id, u, tool.id))
                            affected.add(u.id);
                    }
                }
            return { agents: agents.length, tools: pairs, users: affected.size };
        };
        this.editPolicy = (transform) => { const target = this.scopeTarget(), k = scopeKey(target); const edited = transform(policyClone(this.scopedPolicy(target, true))); this.setState((prev) => ({ policyDrafts: { ...prev.policyDrafts, [k]: edited }, simResult: null })); };
        this.openConditions = (agentId, toolId) => this.setState({ conditionAgent: agentId, conditionTool: toolId, conditionScope: 'agent_tool', conditionUser: this.state.selectedUser, conditionTeam: this.findUser(this.state.selectedUser).team, showExperimentalHelp: false, helpTopic: '', rawChecked: false, modal: 'conditions' });
        this.switchEditor = (editor) => {
            const s = this.state, target = this.scopeTarget(), k = scopeKey(target), attrs = this.attributesForScope(target), p = policyClone(this.scopedPolicy(target, true));
            if (editor === 'raw') {
                if (p.editor === 'raw')
                    return;
                const raw = clausesToCel(p, attrs);
                this.setState((prev) => ({ policyDrafts: { ...prev.policyDrafts, [k]: { ...p, editor: 'raw', raw } }, rawChecked: false }));
                return;
            }
            if (p.editor !== 'raw')
                return;
            const translated = celToClauses(p.raw || '', attrs);
            if (!translated) {
                this.toast('This expression cannot be represented without losing information. Keep editing in CEL mode.');
                return;
            }
            this.setState((prev) => ({ policyDrafts: { ...prev.policyDrafts, [k]: translated }, rawChecked: false }));
        };
        this.editRaw = (value) => { this.editPolicy(p => ({ ...p, editor: 'raw', raw: value })); this.setState({ rawChecked: false }); };
        this.addCondition = () => { const attributes = this.attributesForScope(this.scopeTarget()), a = attributes[0]; if (!a)
            return; this.editPolicy(p => ({ ...p, clauses: p.clauses.concat({ id: 'cl-' + Date.now(), attrId: a.id, operator: 'eq', value: a.kind === 'boolean' ? 'true' : a.kind === 'choice' ? (a.options || [])[0] || '' : a.example || '' }) })); };
        this.updateClause = (id, changes) => this.editPolicy(p => ({ ...p, clauses: p.clauses.map(c => { if (c.id !== id)
                return c; const n = { ...c, ...changes }; if (changes.attrId) {
                const a = this.attributesForScope(this.scopeTarget()).find(x => x.id === changes.attrId);
                n.operator = 'eq';
                n.value = (a === null || a === void 0 ? void 0 : a.kind) === 'choice' ? (a.options || [])[0] || '' : (a === null || a === void 0 ? void 0 : a.kind) === 'boolean' ? 'true' : (a === null || a === void 0 ? void 0 : a.example) || '';
            } return n; }) }));
        this.resetPolicy = () => this.editPolicy(_ => ({ mode: 'all', clauses: [] }));
        this.inspectSpec = (raw) => {
            try {
                const imported = parseOpenAPI(raw).source;
                this.setState((st) => {
                    var _a;
                    const matching = st.sources.find((x) => x.name === imported.name && x.baseUrl === imported.baseUrl);
                    const source = matching || imported;
                    return { sourceSpec: raw, sources: matching ? st.sources : st.sources.concat(source), sourceDraft: source, sourceOperation: source.operations[0].key, sourceField: ((_a = source.operations[0].fields[0]) === null || _a === void 0 ? void 0 : _a.path) || '', sourcePathMap: {}, sourceError: '', sourceTest: null, inspectionOpen: true };
                });
            }
            catch (e) {
                this.setState({ sourceError: (e === null || e === void 0 ? void 0 : e.message) || 'Invalid OpenAPI JSON', sourceDraft: null, inspectionOpen: false });
            }
        };
        this.importSpec = () => this.inspectSpec(this.state.sourceSpec);
        this.importFromUrl = async () => { const u = this.state.sourceUrl.trim(); try {
            const parsed = new URL(u);
            if (parsed.protocol !== 'https:' && !(parsed.hostname === 'localhost' && parsed.protocol === 'http:'))
                throw Error('Use an HTTPS OpenAPI endpoint.');
            this.setState({ sourceError: 'Fetching OpenAPI JSON…' });
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            let response;
            try {
                response = await fetch(parsed.toString(), { signal: controller.signal, credentials: 'omit', redirect: 'error' });
            }
            finally {
                clearTimeout(timeout);
            }
            if (!response.ok)
                throw Error('HTTP ' + response.status);
            const content = await response.text();
            if (content.length > 2000000)
                throw Error('Schema is too large for browser preview.');
            this.inspectSpec(content);
        }
        catch (e) {
            this.setState({ sourceError: 'URL import failed: ' + ((e === null || e === void 0 ? void 0 : e.message) || 'Network blocked. Check CORS or import the JSON file.') });
        } };
        this.help = (topic) => React.createElement("button", { type: "button", className: "context-help-icon", "aria-label": 'Explain ' + topic, title: 'Explain ' + topic, onClick: (e) => { e.stopPropagation(); this.setState({ helpTopic: topic }); } },
            React.createElement(Icon, { name: "help", size: 15 }));
        this.loadExample = () => { this.setState({ sourceSpec: JSON.stringify(exampleOpenAPI, null, 2), sourceSample: JSON.stringify({ id: 'ord_142', status: 'pending', total: 280.5, customer_id: 'cus_77', owner: { team: 'Support' } }, null, 2), sourceError: '', sourceDraft: null, sourceTest: null, inspectionOpen: false }); };
        this.pickOperation = (key) => { var _a, _b; const operation = (_a = this.state.sourceDraft) === null || _a === void 0 ? void 0 : _a.operations.find((o) => o.key === key); this.setState({ sourceOperation: key, sourceField: ((_b = operation === null || operation === void 0 ? void 0 : operation.fields[0]) === null || _b === void 0 ? void 0 : _b.path) || '', sourcePathMap: {}, sourceTest: null }); };
        this.saveMapping = () => {
            const s = this.state, src = s.sourceDraft;
            if (!src) {
                this.toast('Import a schema first.');
                return;
            }
            const operation = src.operations.find(o => o.key === s.sourceOperation), field = operation === null || operation === void 0 ? void 0 : operation.fields.find(f => f.path === s.sourceField);
            if (!operation || !field) {
                this.toast('Select a response field.');
                return;
            }
            if (operation.pathParams.some(p => !s.sourcePathMap[p])) {
                this.toast('Map every URL path parameter to a tool input first.');
                return;
            }
            const duplicate = s.bindings.find((b) => b.toolId === s.sourceTool && b.sourceId === src.id && b.operationKey === operation.key && b.fieldPath === field.path);
            if (duplicate) {
                this.toast('This field is already mapped to that tool.');
                return;
            }
            const id = 'ctx_' + Math.random().toString(36).slice(2, 9);
            const binding = { id, sourceId: src.id, operationKey: operation.key, toolId: s.sourceTool, fieldPath: field.path, pathMap: { ...s.sourcePathMap } };
            this.setState((st) => ({ sources: st.sources.some((x) => x.id === src.id) ? st.sources : st.sources.concat(src), bindings: st.bindings.concat(binding), toast: 'Schema mapping saved. The attribute is available for policies; runtime resolution is not connected in this prototype.' }));
        };
        this.removeBinding = (id) => { this.setState((st) => ({ bindings: st.bindings.filter((b) => b.id !== id), toast: 'Mapping removed. Policies using it now require repair.' })); };
        this.testSample = () => { try {
            const src = this.state.sourceDraft, op = src === null || src === void 0 ? void 0 : src.operations.find(o => o.key === this.state.sourceOperation), field = op === null || op === void 0 ? void 0 : op.fields.find(f => f.path === this.state.sourceField);
            if (!field)
                throw Error('Choose a field first.');
            const payload = JSON.parse(this.state.sourceSample);
            const value = pickJSONPath(payload, field.path);
            if (value === undefined)
                throw Error('The sample response does not contain ' + field.path);
            this.setState({ sourceTest: { ok: true, value: JSON.stringify(value) } });
        }
        catch (e) {
            this.setState({ sourceTest: { ok: false, value: e.message || 'Invalid sample JSON' } });
        } };
        this.contextValue = (a, user, agent, toolId, values) => {
            if (a.id === 'identity.team')
                return user.team;
            if (a.id === 'identity.status')
                return user.status;
            if (a.id === 'agent.environment')
                return agent.environment;
            if (a.id === 'agent.status')
                return agent.status;
            return values[a.id] !== undefined ? values[a.id] : '';
        };
        this.evaluate = (u, a, t, values, draft) => {
            var _a, _b;
            const user = this.findUser(u);
            const agent = this.findAgent(a);
            const tool = this.findTool(t);
            const member = this.has('member', a, u, draft), granted = this.has('capability', a, t, draft);
            const checks = [{ ok: user.status === 'active', label: 'User active in identity provider', detail: user.status === 'active' ? 'Active identity' : 'User disabled' }, { ok: member, label: 'User associated with agent type', detail: member ? 'Relation exists' : 'Relation not found' }, { ok: granted, label: 'Agent can invoke tool', detail: granted ? 'Capability granted' : 'Capability not granted' }, { ok: tool.approved !== false || this.state.reviewed, label: 'Tool reviewed', detail: tool.approved === false && !this.state.reviewed ? 'New tool requires review' : 'Catalog accepted' }];
            const applicable = this.applicableRules(a, u, t, draft);
            for (const { target, policy } of applicable) {
                const attrs = this.attributesForScope(target), compiled = checkPolicy(policy, attrs), label = ((_a = scopes.find(x => x.id === target.scope)) === null || _a === void 0 ? void 0 : _a.label) || target.scope;
                if (!compiled.ok) {
                    checks.push({ ok: false, label: 'Invalid condition · ' + label, detail: compiled.error || 'Invalid rule' });
                    continue;
                }
                if (!(policy.editor === 'raw' && ((_b = policy.raw) === null || _b === void 0 ? void 0 : _b.trim())) && !policy.clauses.length)
                    continue;
                try {
                    const env = {};
                    (compiled.used || []).forEach(attr => { const v = this.contextValue(attr, user, agent, t, values); if (attr.source === 'provider' && String(v || '').trim() === '')
                        throw Error('OpenAPI field ' + attr.label + ' not resolved; no trusted PIP value.'); env[celVar(attr)] = celInputValue(attr, v); });
                    const pass = evalCel(compiled.ast, env) === true;
                    checks.push({ ok: pass, label: 'Condition · ' + label, detail: pass ? 'Contextual restriction satisfied' : this.scopeSummary(target) + ' · condition failed' });
                }
                catch (e) {
                    checks.push({ ok: false, label: 'Missing trusted context · ' + label, detail: e.message || 'Evaluation failed' });
                }
            }
            const allowed = checks.filter(x => !x.label.startsWith('  ')).every(x => x.ok);
            const failed = checks.find(x => !x.ok && !x.label.startsWith('  '));
            return { allowed, checks, reason: failed ? failed.detail : 'All required checks passed' };
        };
        this.simulate = () => { const s = this.state, values = {}; this.attributes(s.selectedTool).forEach(a => { values[a.id] = this.contextValue(a, this.findUser(s.selectedUser), this.findAgent(s.selectedAgent), s.selectedTool, { [a.id]: s.testInputs[s.selectedTool + '::' + a.id] !== undefined ? s.testInputs[s.selectedTool + '::' + a.id] : a.example || '' }); }); const result = this.evaluate(s.selectedUser, s.selectedAgent, s.selectedTool, values, s.includeDraft); this.setState({ simResult: { ...result, userId: s.selectedUser, agentId: s.selectedAgent, toolId: s.selectedTool, values, draft: s.includeDraft } }); };
        this.saveCurrentTest = (expected) => { const result = this.state.simResult; if (!result) {
            this.toast('Run Evaluate access first.');
            return;
        } const name = window.prompt('Name this authorization test', `${this.findAgent(result.agentId).name} / ${result.toolId} / ${expected ? 'ALLOW' : 'DENY'}`); if (!(name === null || name === void 0 ? void 0 : name.trim()))
            return; const test = { id: 'test_' + Date.now(), name: name.trim(), userId: result.userId, agentId: result.agentId, toolId: result.toolId, values: { ...result.values }, expected }; this.setState((s) => ({ accessTests: s.accessTests.concat(test), testSuiteResult: null, toast: 'Regression test saved' })); };
        this.runTestSuite = (draft = true) => { const tests = this.state.accessTests; const results = tests.map(t => { const actual = this.evaluate(t.userId, t.agentId, t.toolId, t.values, draft); return { ...t, actual: actual.allowed, pass: actual.allowed === t.expected, reason: actual.reason, checks: actual.checks }; }); this.setState({ testSuiteResult: { draft, results, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length } }); return results; };
        this.removeTest = (id) => this.setState((s) => ({ accessTests: s.accessTests.filter((t) => t.id !== id), testSuiteResult: null }));
        this.reviewTool = () => { this.setState((s) => ({ reviewed: true, issues: { ...s.issues, newTool: false }, toast: 'Tool classified. You can now assign its capabilities.' })); };
        this.clearToast = () => this.setState({ toast: '' });
        this.reset = () => { try {
            localStorage.removeItem(lsKey);
        }
        catch (e) { } this.setState({ agents: seedAgents, granted: seedGranted, members: seedMembers, decisions: seedDecisions, policies: migratePolicies(initialPolicies), policyDrafts: {}, sources: [], bindings: [], accessTests: [], testSuiteResult: null, sourceSpec: '', sourceDraft: null, sourceError: '', testInputs: {}, pending: [], issues: { newTool: true, denials: true, disabled: true }, reviewed: false, history: [{ description: 'Policy v12 published', detail: 'Finance Agent · João Almeida', time: 'Yesterday, 16:24' }], selectedAgent: 'finance', toast: 'Demo reset to sample data' }); };
        this.openItem = (kind, id) => { if (kind === 'agent') {
            this.go('workspace', { selectedAgent: id, section: 'capabilities', agentSearch: '' });
        }
        else if (kind === 'tool') {
            this.go('catalog', { catalogType: 'tools', catalogSearch: id, selectedTool: id });
        }
        else if (kind === 'user') {
            this.go('catalog', { catalogType: 'people', catalogSearch: id, selectedUser: id });
        }
        else if (kind === 'decision') {
            this.go('investigate', { selectedDecision: id });
        } };
        this.paletteItems = () => { const q = this.state.search.toLowerCase().trim(); const entries = [{ type: 'action', id: 'newagent', name: 'Create a new agent', sub: 'Register an agent type' }, { type: 'action', id: 'simulate', name: 'Test an authorization decision', sub: 'Open the evaluation workspace' }, { type: 'action', id: 'changes', name: 'Review unpublished changes', sub: plural(this.state.pending.length, 'change', 'changes') }, { type: 'action', id: 'issues', name: 'Review attention items', sub: 'Operational workspace' }, { type: 'action', id: 'sources', name: 'Connect a context source', sub: 'Import OpenAPI and map response fields' }].concat(this.state.agents.map((a) => ({ type: 'agent', id: a.id, name: a.name, sub: 'Agent · ' + a.environment })), this.state.tools.map((t) => ({ type: 'tool', id: t.id, name: t.id, sub: 'Tool · ' + t.server })), this.state.users.map((u) => ({ type: 'user', id: u.id, name: u.name, sub: 'User · ' + u.email }))); return (q ? entries.filter(x => (x.name + ' ' + x.sub).toLowerCase().includes(q)) : entries).slice(0, 9); };
        this.runPalette = (x) => { this.setState({ paletteOpen: false }); if (x.type === 'action') {
            if (x.id === 'newagent')
                this.setState({ modal: 'agent' });
            if (x.id === 'simulate')
                this.go('workspace', { section: 'capabilities' });
            if (x.id === 'changes')
                this.setState({ pendingView: true });
            if (x.id === 'issues')
                this.go('home');
            if (x.id === 'sources')
                this.go('sources');
            return;
        } this.openItem(x.type, x.id); };
        const cached = readCache();
        if (cached === null || cached === void 0 ? void 0 : cached.customToolAttributes)
            Object.assign(toolAttributeSeeds, cached.customToolAttributes);
        this.state = {
            page: 'home', section: 'capabilities', agents: (cached === null || cached === void 0 ? void 0 : cached.agents) || seedAgents, users: seedUsers, tools: (cached === null || cached === void 0 ? void 0 : cached.tools) || initialTools,
            granted: (cached === null || cached === void 0 ? void 0 : cached.granted) || seedGranted, members: (cached === null || cached === void 0 ? void 0 : cached.members) || seedMembers, decisions: (cached === null || cached === void 0 ? void 0 : cached.decisions) || seedDecisions,
            pending: [], accessTests: (cached === null || cached === void 0 ? void 0 : cached.accessTests) || [], testSuiteResult: null, issues: { newTool: (_c = (_a = cached === null || cached === void 0 ? void 0 : cached.issues) === null || _a === void 0 ? void 0 : _a.newTool) !== null && _c !== void 0 ? _c : true, denials: true, disabled: (_d = (_b = cached === null || cached === void 0 ? void 0 : cached.issues) === null || _b === void 0 ? void 0 : _b.disabled) !== null && _d !== void 0 ? _d : true },
            selectedAgent: 'engineering', selectedDecision: 'dec_8d96', decisionOpen: false, inboxType: 'all', inboxPage: 0, inboxSeen: {}, selectedUser: 'u4', selectedTool: 'pull_requests.merge',
            agentSearch: '', toolSearch: '', memberSearch: '', catalogSearch: '', catalogType: 'tools', showAllAgents: false, readOnlyFilter: false,
            testInputs: {}, sources: (cached === null || cached === void 0 ? void 0 : cached.sources) || [], bindings: (cached === null || cached === void 0 ? void 0 : cached.bindings) || [], sourceSpec: '', sourceUrl: '', sourceImportMode: 'file', sourceError: '', sourceDraft: null, sourceOperation: '', sourceField: '', sourceTool: 'orders.cancel', sourcePathMap: {}, sourceSample: '', sourceTest: null, sourceSearch: '', mcpSearch: '', mcpSelectedServer: '', mcpSchemaText: '', mcpSchemaError: '', idpClaimSearch: '', idpClaimSelection: (cached === null || cached === void 0 ? void 0 : cached.idpClaimSelection) || ['sub', 'email', 'groups', 'department'], inspectionOpen: false, sourceView: 'catalog', policies: migratePolicies((cached === null || cached === void 0 ? void 0 : cached.policies) || initialPolicies), policyDrafts: {}, conditionAgent: 'engineering', conditionTool: 'pull_requests.merge', conditionScope: 'agent_tool', conditionUser: 'u4', conditionTeam: 'Engineering', showExperimentalHelp: false, helpTopic: '', rawChecked: false, includeDraft: false, simResult: null, search: '', paletteOpen: false, modal: '', toast: '', pendingView: false,
            reviewed: (cached === null || cached === void 0 ? void 0 : cached.reviewed) || false, agentForm: { name: '', description: '' }, connectForm: { name: '', url: '' }, selectedServer: 'Finance MCP',
            activeHomeQuery: '', history: (cached === null || cached === void 0 ? void 0 : cached.history) || [{ description: 'Policy v12 published', detail: 'Finance Agent · João Almeida', time: 'Yesterday, 16:24' }, { description: 'MCP server connected', detail: 'Knowledge MCP', time: 'Yesterday, 10:12' }]
        };
    }
    componentDidUpdate(_p, prev) { if (prev.granted !== this.state.granted || prev.members !== this.state.members || prev.agents !== this.state.agents || prev.decisions !== this.state.decisions || prev.issues !== this.state.issues || prev.reviewed !== this.state.reviewed || prev.history !== this.state.history || prev.policies !== this.state.policies || prev.sources !== this.state.sources || prev.bindings !== this.state.bindings || prev.idpClaimSelection !== this.state.idpClaimSelection || prev.tools !== this.state.tools || prev.accessTests !== this.state.accessTests) {
        this.remember();
    } }
    componentDidMount() { document.addEventListener('keydown', this.hotkeys); }
    componentWillUnmount() { document.removeEventListener('keydown', this.hotkeys); }
    renderTop() { return React.createElement("header", { className: "topbar" },
        React.createElement("div", { className: "nav-inner" },
            React.createElement("button", { className: "brand", onClick: () => this.go('home'), "aria-label": "Chokepoint home" },
                React.createElement("img", { src: "./logo.png", alt: "Chokepoint" })),
            React.createElement("span", { className: "nav-line" }),
            React.createElement("div", { className: "project-switch" },
                React.createElement("span", { className: "avatar-mini" }, "A"),
                React.createElement("span", { className: "project-text" }, "Acme workspace"),
                React.createElement(Icon, { name: "down", size: 14 })),
            React.createElement("span", { className: "environment" },
                React.createElement("span", { className: "environment-dot" }),
                " Sandbox"),
            React.createElement("nav", { className: "main-nav", "aria-label": "Principal" },
                React.createElement("button", { className: this.state.page === 'home' ? 'nav-active' : '', onClick: () => this.go('home') }, "Overview"),
                React.createElement("button", { className: this.state.page === 'workspace' || this.state.page === 'sources' || this.state.page === 'catalog' ? 'nav-active' : '', onClick: () => this.go('workspace') }, "Access"),
                React.createElement("button", { className: this.state.page === 'investigate' || this.state.page === 'activity' ? 'nav-active' : '', onClick: () => this.go('investigate') }, "Investigate")),
            React.createElement("div", { className: "nav-end" },
                React.createElement("button", { className: "icon-button optional", title: "Audit trail", onClick: () => this.go('activity') },
                    React.createElement(Icon, { name: "history" })),
                React.createElement("span", { className: "user-avatar", title: "Developer account" }, "FM")))); }
    renderHome() {
        const s = this.state;
        const issueCount = Number(s.issues.newTool) + Number(s.issues.denials) + Number(s.issues.disabled);
        const sigTypes = { 'tool-discovery': 'Tool discovery', 'requests-denied': 'Requests denied', 'idp-user-disable': 'IdP user disabled' };
        const sigAll = [
            ...(s.issues.newTool ? [{ id: 'sig_01', type: 'tool-discovery', subject: 'New tool found', note: 'Waiting for classification', ctx: 'crm.contacts.export', ctx2: 'CRM MCP', at: 'Oct 29 · 08:47', label: 'Review', go: () => this.go('catalog', { catalogType: 'tools', catalogSearch: 'crm.contacts.export', selectedTool: 'crm.contacts.export' }) }] : []),
            ...(s.issues.denials ? [{ id: 'sig_02', type: 'requests-denied', subject: 'Requests denied', note: 'Investigation ready', ctx: 'payments.refund', ctx2: 'Finance Agent', at: 'Oct 29 · 09:24', label: 'Investigate', go: () => this.go('investigate', { selectedDecision: 'dec_8e03' }) }] : []),
            ...(s.issues.disabled ? [{ id: 'sig_03', type: 'idp-user-disable', subject: 'Disabled user still has associations', note: 'Disabled in the IdP', ctx: 'Lucas Oliveira', ctx2: 'Support Agent', at: 'Oct 28 · 17:10', label: 'Resolve', go: () => this.go('catalog', { catalogType: 'people', catalogSearch: 'Lucas', selectedUser: 'u8' }) }] : []),
            { id: 'sig_04', type: 'requests-denied', subject: 'Requests denied', note: 'Not enough reviews', ctx: 'pull_requests.merge', ctx2: 'Engineering Agent', at: 'Oct 29 · 09:16', label: 'Investigate', go: () => this.go('investigate', { selectedDecision: 'dec_8d96' }) },
            { id: 'sig_05', type: 'tool-discovery', subject: 'New tool found', note: 'Waiting for classification', ctx: 'documents.export', ctx2: 'Knowledge MCP', at: 'Oct 27 · 14:02', label: 'Review', go: () => this.go('catalog', { catalogType: 'tools', catalogSearch: 'documents.export', selectedTool: 'documents.export' }) },
            { id: 'sig_06', type: 'idp-user-disable', subject: 'Disabled user still has associations', note: 'Disabled in the IdP', ctx: 'Rafa Sousa', ctx2: 'Engineering Agent', at: 'Oct 26 · 11:30', label: 'Resolve', go: () => this.go('catalog', { catalogType: 'people', catalogSearch: 'Rafa' }) },
            { id: 'sig_07', type: 'requests-denied', subject: 'Requests denied', note: 'Capability not granted', ctx: 'repos.delete', ctx2: 'Engineering Agent', at: 'Oct 26 · 09:12', label: 'Investigate', go: () => this.go('investigate') }
        ];
        const sigRows = sigAll.filter((x) => s.inboxType === 'all' || x.type === s.inboxType), sigPages = Math.max(1, Math.ceil(sigRows.length / 5)), sigPage = Math.min(s.inboxPage, sigPages - 1), sigShown = sigRows.slice(sigPage * 5, sigPage * 5 + 5), pending = sigAll.filter((x) => !s.inboxSeen[x.id]).length;
        return React.createElement("div", { className: "home-container page-fade" },
            React.createElement("div", { className: "main-dashboard-grid" },
                React.createElement("div", { className: "home-left" },
                    React.createElement("div", { className: "metric-row" },
                        React.createElement("button", { className: "metric-card", onClick: () => { const el = document.querySelector('.attention-panel'); if (el)
                                el.scrollIntoView({ behavior: 'smooth' }); } },
                            React.createElement("small", null, "PENDING"),
                            React.createElement("strong", null, pending),
                            React.createElement("span", null,
                                "signals waiting for review ",
                                React.createElement(Icon, { name: "arrow", size: 14 }))),
                        React.createElement("button", { className: "metric-card metric-deny", onClick: () => this.go('investigate') },
                            React.createElement("small", null, "DENIED TODAY"),
                            React.createElement("strong", null, s.decisions.filter((d) => !d.result).length),
                            React.createElement("span", null,
                                "investigate decisions ",
                                React.createElement(Icon, { name: "arrow", size: 14 })),
                            differs("In the Admin, this counter filters the Inbox to requests-denied signals. In the mock it opens the decisions list.")),
                        React.createElement("button", { className: "metric-card", onClick: () => this.go('catalog', { catalogType: 'tools', catalogSearch: '' }) },
                            React.createElement("small", null, "TOOLS WITHOUT REVIEW"),
                            React.createElement("strong", null, s.reviewed ? 0 : s.tools.filter((t) => t.approved === false).length),
                            React.createElement("span", null,
                                "open catalog ",
                                React.createElement(Icon, { name: "arrow", size: 14 })),
                            differs("In the Admin, this counter opens Access > Integrations (Custom MCP tab). In the mock it opens the tool catalog."))),
                    React.createElement("section", { className: "attention-panel" },
                        React.createElement("div", { className: "section-head" },
                            React.createElement("div", null,
                                React.createElement("span", { className: "section-kicker" }, "INBOX"),
                                React.createElement("h2", null, pending ? plural(pending, 'item needs', 'items need') + ' attention' : 'All clear for now')),
                            React.createElement("select", { className: "inbox-filter", "aria-label": "Filter by type", value: s.inboxType, onChange: (e) => this.setState({ inboxType: e.target.value, inboxPage: 0 }) },
                                React.createElement("option", { value: "all" }, "All types"),
                                Object.keys(sigTypes).map((k) => React.createElement("option", { key: k, value: k }, sigTypes[k])))),
                        React.createElement("div", { className: "inbox-columns" },
                            React.createElement("span", null, "TYPE"),
                            React.createElement("span", null, "SUBJECT"),
                            React.createElement("span", null, "CONTEXT"),
                            React.createElement("span", null, "WHEN"),
                            React.createElement("span", null)),
                        sigShown.map((x) => React.createElement("button", { key: x.id, className: classNames('inbox-row', s.inboxSeen[x.id] && 'inbox-seen'), onClick: () => { this.setState((st) => ({ inboxSeen: { ...st.inboxSeen, [x.id]: true } })); x.go(); } },
                            React.createElement("span", null,
                                React.createElement("span", { className: classNames('inbox-tag', 'tag-' + x.type) }, sigTypes[x.type])),
                            React.createElement("span", { className: "inbox-main" },
                                React.createElement("strong", null, x.subject),
                                React.createElement("small", null,
                                    x.note,
                                    React.createElement("span", { className: "planned-tag" }, "Planned \u00B7 2026-10-29"))),
                            React.createElement("span", { className: "inbox-main" },
                                React.createElement("code", null, x.ctx),
                                x.type === 'tool-discovery' && React.createElement("span", { className: "planned-tag" }, "Planned \u00B7 2026-10-29"),
                                React.createElement("small", null, x.ctx2),
                                x.type === 'idp-user-disable' && React.createElement("span", { className: "planned-tag" }, "Planned \u00B7 2026-10-29"),
                                x.type === 'requests-denied' && differs("In the Admin, this line shows the agent identifier and the request count, for example finance · 3 requests. The mock shows the agent name.")),
                            React.createElement("span", { className: "inbox-when" },
                                x.at,
                                s.inboxSeen[x.id] && differs("In the Admin, a reviewed signal leaves the Inbox. The mock keeps it, dimmed.")),
                            React.createElement("span", { className: "issue-action" },
                                React.createElement("span", { className: "issue-action-label" },
                                    x.label,
                                    " ",
                                    React.createElement(Icon, { name: "arrow", size: 16 })),
                                x.type !== 'tool-discovery' && React.createElement("span", { className: "planned-tag" }, "Planned \u00B7 2026-10-29")))),
                        !sigShown.length && React.createElement("div", { className: "empty-good" },
                            React.createElement(Icon, { name: "circlecheck", size: 24 }),
                            " No signals for this filter."),
                        React.createElement("div", { className: "inbox-pager" },
                            React.createElement("span", null, sigRows.length ? `${sigPage * 5 + 1}–${sigPage * 5 + sigShown.length} de ${sigRows.length}` : '0 de 0'),
                            React.createElement("span", null,
                                React.createElement("button", { disabled: sigPage === 0, onClick: () => this.setState({ inboxPage: sigPage - 1 }) }, "Previous"),
                                React.createElement("button", { disabled: sigPage >= sigPages - 1, onClick: () => this.setState({ inboxPage: sigPage + 1 }) }, "Next")))))),
            React.createElement("div", { className: "demo-strip" },
                React.createElement(Icon, { name: "code", size: 16 }),
                " Interactive prototype \u00B7 sample data stored locally \u00B7 no live IdP, OpenFGA or MCP connections ",
                React.createElement("button", { onClick: this.reset }, "Reset demo")));
    }
    renderAccessNav() { return React.createElement("div", { className: "access-subnav", "aria-label": "Access workspace navigation" },
        React.createElement("div", { className: "access-subnav-links" },
            React.createElement("button", { className: this.state.page === 'workspace' ? 'selected' : '', onClick: () => this.go('workspace') },
                React.createElement(Icon, { name: "shield", size: 15 }),
                " Permissions"),
            React.createElement("button", { className: this.state.page === 'sources' ? 'selected' : '', onClick: () => this.go('sources') },
                React.createElement(Icon, { name: "link", size: 15 }),
                " Context sources ",
                React.createElement("span", null, this.state.bindings.length))),
        React.createElement("span", null, "Model access here. Resolve trusted values via context sources.")); }
    renderSources() {
        const s = this.state, src = s.sourceDraft, op = src === null || src === void 0 ? void 0 : src.operations.find((x) => x.key === s.sourceOperation), fields = (op === null || op === void 0 ? void 0 : op.fields) || [];
        const args = (toolAttributeSeeds[s.sourceTool] || []).filter(x => x.source === 'arguments');
        const available = s.sourceTool ? this.attributes(s.sourceTool) : [];
        if (s.sourceView === 'catalog')
            return React.createElement("div", { className: "sources-page page-fade" },
                this.renderAccessNav(),
                React.createElement("div", { className: "sources-heading" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "eyebrow" }, "ACCESS / CONTEXT SOURCES"),
                        React.createElement("h1", null,
                            "Context Sources ",
                            this.help("sources")),
                        React.createElement("p", null, "Sources of trusted context and the bindings that make their fields available to policies.")),
                    React.createElement("button", { className: "button-primary", onClick: () => this.setState({ sourceView: 'import', sourceSpec: '', sourceDraft: null, sourceError: '', sourceTest: null, inspectionOpen: false, sourceImportMode: 'file' }) },
                        React.createElement(Icon, { name: "plus", size: 16 }),
                        " Add source")),
                React.createElement("div", { className: "source-catalog-toolbar" },
                    React.createElement("div", { className: "field-search" },
                        React.createElement(Icon, { name: "search", size: 16 }),
                        React.createElement("input", { "aria-label": "Search context sources", placeholder: "Search sources or attributes\u2026", value: s.sourceSearch, onChange: (e) => this.setState({ sourceSearch: e.target.value }) })),
                    React.createElement("span", null,
                        s.sources.length,
                        " imported \u00B7 ",
                        s.bindings.length,
                        " bindings")),
                React.createElement("section", { className: "source-catalog-panel" },
                    React.createElement("div", { className: "source-catalog-section-title" },
                        "AVAILABLE SOURCES ",
                        this.help('sources')),
                    [{ id: 'builtin-mcp', name: 'MCP tool arguments', subtitle: 'tools/list · inputSchema · arguments received by PEP', kind: 'Built-in', topic: 'mcp' }, { id: 'builtin-identity', name: 'Identity & agent context', subtitle: 'Validated IdP claims · agent registry · gateway request facts', kind: 'Built-in', topic: 'identity' }].filter(x => (x.name + ' ' + x.subtitle).toLowerCase().includes(s.sourceSearch.toLowerCase())).map(x => React.createElement("div", { className: "source-catalog-row", key: x.id },
                        React.createElement("span", { className: "source-catalog-icon" },
                            React.createElement(Icon, { name: x.id === 'builtin-mcp' ? 'code' : 'users', size: 19 })),
                        React.createElement("div", { className: "source-catalog-text" },
                            React.createElement("strong", null, x.name),
                            React.createElement("small", null, x.subtitle)),
                        React.createElement("span", { className: "source-tile-status good" }, x.kind),
                        React.createElement("button", { className: "button-subtle", onClick: () => { var _a; return this.setState({ sourceView: x.id === 'builtin-mcp' ? 'mcp' : 'identity', mcpSelectedServer: s.mcpSelectedServer || ((_a = s.tools[0]) === null || _a === void 0 ? void 0 : _a.server) }); } },
                            "Manage ",
                            React.createElement(Icon, { name: "arrow", size: 13 })))),
                    s.sources.filter((x) => (x.name + ' ' + x.baseUrl + ' ' + x.operations.map(o => o.key).join(' ')).toLowerCase().includes(s.sourceSearch.toLowerCase())).map((x) => React.createElement("div", { className: "source-catalog-row", key: x.id },
                        React.createElement("span", { className: "source-catalog-icon" },
                            React.createElement(Icon, { name: "link", size: 19 })),
                        React.createElement("div", { className: "source-catalog-text" },
                            React.createElement("strong", null, x.name),
                            React.createElement("small", null,
                                x.baseUrl || 'No API base URL',
                                " \u00B7 ",
                                x.operations.length,
                                " read operations \u00B7 ",
                                s.bindings.filter((b) => b.sourceId === x.id).length,
                                " bindings")),
                        React.createElement("span", { className: "source-tile-status" }, "OpenAPI"),
                        React.createElement("button", { className: "button-subtle", onClick: () => { var _a, _b, _c; return this.setState({ sourceView: 'detail', sourceDraft: x, sourceOperation: ((_a = x.operations[0]) === null || _a === void 0 ? void 0 : _a.key) || '', sourceField: ((_c = (_b = x.operations[0]) === null || _b === void 0 ? void 0 : _b.fields[0]) === null || _c === void 0 ? void 0 : _c.path) || '', sourceSpec: JSON.stringify(x.spec, null, 2), sourceTest: null, inspectionOpen: true }); } },
                            "Inspect ",
                            React.createElement(Icon, { name: "arrow", size: 13 })),
                        React.createElement("button", { className: "icon-button", title: 'Remove ' + x.name, "aria-label": 'Remove ' + x.name, onClick: () => { if (window.confirm('Remove ' + x.name + ' and its context bindings?'))
                                this.setState((st) => ({ sources: st.sources.filter((v) => v.id !== x.id), bindings: st.bindings.filter((b) => b.sourceId !== x.id), toast: 'Source removed' })); } },
                            React.createElement(Icon, { name: "trash", size: 15 })))),
                    !s.sources.length && React.createElement("div", { className: "source-catalog-empty" },
                        "No external API sources yet. ",
                        React.createElement("button", { onClick: () => this.setState({ sourceView: 'import', sourceSpec: '', sourceDraft: null, sourceError: '', sourceTest: null }) }, "Import OpenAPI"),
                        " to resolve fields from a trusted API.")),
                React.createElement("section", { className: "source-catalog-panel" },
                    React.createElement("div", { className: "source-catalog-section-title" },
                        "CONTEXT BINDINGS \u00B7 ",
                        s.bindings.length,
                        " ",
                        this.help('bindings')),
                    s.bindings.length ? s.bindings.filter((b) => { const provider = s.sources.find((v) => v.id === b.sourceId); return (b.toolId + ' ' + b.fieldPath + ' ' + (provider === null || provider === void 0 ? void 0 : provider.name)).toLowerCase().includes(s.sourceSearch.toLowerCase()); }).map((b) => { const provider = s.sources.find((v) => v.id === b.sourceId); return React.createElement("div", { className: "source-catalog-row", key: b.id },
                        React.createElement("span", { className: "source-catalog-icon" },
                            React.createElement(Icon, { name: "filter", size: 18 })),
                        React.createElement("div", { className: "source-catalog-text" },
                            React.createElement("strong", null,
                                b.toolId,
                                " ",
                                React.createElement("span", { className: "source-catalog-arrow" }, "\u2190"),
                                " ",
                                b.fieldPath),
                            React.createElement("small", null,
                                (provider === null || provider === void 0 ? void 0 : provider.name) || 'Missing provider',
                                " \u00B7 ",
                                b.operationKey,
                                " \u00B7 ",
                                Object.entries(b.pathMap).map(([k, v]) => '{' + k + '} ← ' + v).join(' · '))),
                        React.createElement("button", { className: "button-subtle", onClick: () => { if (provider)
                                this.setState({ sourceView: 'detail', sourceDraft: provider, sourceOperation: b.operationKey, sourceField: b.fieldPath, sourceSpec: JSON.stringify(provider.spec, null, 2), inspectionOpen: true }); } }, "View source"),
                        React.createElement("button", { className: "icon-button", title: "Remove binding", onClick: () => this.removeBinding(b.id) },
                            React.createElement(Icon, { name: "trash", size: 15 }))); }) : React.createElement("div", { className: "source-catalog-empty" }, "No mappings yet. Import a source, select a GET operation, and bind a response field to a tool.")),
                React.createElement("div", { className: "source-architecture-note" },
                    React.createElement(Icon, { name: "shield", size: 18 }),
                    React.createElement("div", null,
                        React.createElement("strong", null, "Runtime boundary"),
                        React.createElement("p", null, "MCP arguments and validated identity come from the request boundary. OpenAPI mappings describe where to obtain external values; the production Context Resolver still needs an authenticated read to supply those values to OpenFGA."))));
        if (s.sourceView === 'mcp') {
            const servers = Array.from(new Set(s.tools.map(t => t.server)));
            const selected = servers.includes(s.mcpSelectedServer) ? s.mcpSelectedServer : servers[0];
            const serverTools = s.tools.filter(t => t.server === selected && (t.id + ' ' + t.description).toLowerCase().includes(s.mcpSearch.toLowerCase()));
            return React.createElement("div", { className: "sources-page page-fade" },
                this.renderAccessNav(),
                React.createElement("div", { className: "sources-heading" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "eyebrow" }, "CONTEXT SOURCES / MCP"),
                        React.createElement("h1", null,
                            "MCP Tool Schemas ",
                            this.help('mcp')),
                        React.createElement("p", null, "Veja quais ferramentas e par\u00E2metros est\u00E3o dispon\u00EDveis para escrever condi\u00E7\u00F5es. Importa\u00E7\u00E3o demonstrativa de tools/list.")),
                    React.createElement("button", { className: "button-subtle", onClick: () => this.setState({ sourceView: 'catalog' }) }, "\u2190 All sources")),
                React.createElement("section", { className: "source-catalog-panel" },
                    React.createElement("div", { className: "source-catalog-section-title" },
                        "CONNECTED SERVERS \u00B7 ",
                        servers.length,
                        " ",
                        this.help('mcp')),
                    React.createElement("div", { className: "source-form-row" },
                        React.createElement("label", null, "Servidor MCP"),
                        React.createElement("select", { "aria-label": "Select MCP server", value: selected, onChange: (e) => this.setState({ mcpSelectedServer: e.target.value, mcpSearch: '' }) }, servers.map(server => React.createElement("option", { key: server, value: server }, server)))),
                    React.createElement("div", { className: "source-catalog-toolbar" },
                        React.createElement("div", { className: "field-search" },
                            React.createElement(Icon, { name: "search", size: 15 }),
                            React.createElement("input", { placeholder: "Filter tools and arguments", value: s.mcpSearch, onChange: (e) => this.setState({ mcpSearch: e.target.value }) })),
                        React.createElement("span", null,
                            serverTools.length,
                            " tools \u00B7 demo registry")),
                    serverTools.map((tool) => React.createElement("div", { className: "source-catalog-operation", key: tool.id },
                        React.createElement("div", { className: "source-catalog-operation-head" },
                            React.createElement("strong", null, tool.id),
                            React.createElement("span", null,
                                (toolAttributeSeeds[tool.id] || []).length,
                                " declared arguments")),
                        React.createElement("div", { className: "source-catalog-fields" }, (toolAttributeSeeds[tool.id] || []).length ? (toolAttributeSeeds[tool.id] || []).map(a => React.createElement("div", { key: a.id },
                            React.createElement("code", null, a.id),
                            React.createElement("span", null,
                                a.kind,
                                a.options ? ' · ' + a.options.join(', ') : ''))) : React.createElement("div", null, "No typed arguments in the local example for this tool")),
                        React.createElement("button", { className: "button-subtle", onClick: () => this.setState({ page: 'workspace', section: 'capabilities', selectedTool: tool.id, selectedAgent: s.selectedAgent, sourceView: 'catalog' }) },
                            "Use in Access ",
                            React.createElement(Icon, { name: "arrow", size: 13 }))))),
                React.createElement("section", { className: "source-catalog-panel" },
                    React.createElement("div", { className: "source-catalog-section-title" },
                        "IMPORT A tools/list RESPONSE ",
                        this.help('mcp')),
                    React.createElement("p", { className: "helper-copy" },
                        "Paste a JSON object returned by tools/list, such as ",
                        `{"tools":[{"name":"repo.find","inputSchema":{"type":"object","properties":{"query":{"type":"string"}}}}]}`,
                        ". This updates only the demo tool registry. It does not connect to a live server."),
                    React.createElement("textarea", { className: "source-spec-input", "aria-label": "MCP tools list response", placeholder: "Paste tools/list JSON", value: s.mcpSchemaText, onChange: (e) => this.setState({ mcpSchemaText: e.target.value, mcpSchemaError: '' }) }),
                    s.mcpSchemaError && React.createElement("div", { className: "source-validation-error" }, s.mcpSchemaError),
                    React.createElement("button", { className: "button-primary", onClick: () => { try {
                            const data = JSON.parse(s.mcpSchemaText);
                            if (!Array.isArray(data.tools) || !data.tools.length)
                                throw Error('Expected an object with a non-empty tools array.');
                            const newTools = [];
                            for (const t of data.tools) {
                                if (typeof t.name !== 'string' || !t.name.trim())
                                    throw Error('Every tool needs a name.');
                                if (!t.inputSchema || t.inputSchema.type !== 'object')
                                    throw Error('Tool ' + t.name + ' must include an object inputSchema.');
                                const id = t.name;
                                toolAttributeSeeds[id] = Object.entries(t.inputSchema.properties || {}).map(([k, v]) => { var _a; return ({ id: 'arguments.' + k, label: k, kind: v.enum ? 'choice' : v.type === 'integer' || v.type === 'number' ? 'number' : v.type === 'boolean' ? 'boolean' : 'text', source: 'arguments', options: (_a = v.enum) === null || _a === void 0 ? void 0 : _a.map(String) }); });
                                newTools.push({ id, server: selected || 'Imported MCP', description: String(t.description || 'Imported from tools/list response'), risk: 'read' });
                            }
                            this.setState((prev) => ({ tools: [...prev.tools.filter((t) => !newTools.some(n => n.id === t.id)), ...newTools], mcpSchemaError: '', mcpSchemaText: '', toast: newTools.length + ' tools imported to demo registry' }));
                        }
                        catch (e) {
                            this.setState({ mcpSchemaError: e.message || 'Invalid JSON' });
                        } } },
                        React.createElement(Icon, { name: "plus", size: 14 }),
                        " Import tools")));
        }
        if (s.sourceView === 'identity') {
            const claims = [{ id: 'sub', name: 'Subject ID', type: 'text' }, { id: 'email', name: 'Email', type: 'text' }, { id: 'groups', name: 'Group memberships', type: 'list' }, { id: 'department', name: 'Department', type: 'text' }, { id: 'tenant_id', name: 'Tenant ID', type: 'text' }, { id: 'email_verified', name: 'Email verified', type: 'boolean' }, { id: 'locale', name: 'Locale', type: 'text' }];
            return React.createElement("div", { className: "sources-page page-fade" },
                this.renderAccessNav(),
                React.createElement("div", { className: "sources-heading" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "eyebrow" }, "CONTEXT SOURCES / IDENTITY"),
                        React.createElement("h1", null,
                            "Identity & agent context ",
                            this.help('identity')),
                        React.createElement("p", null, "Gerencie o cat\u00E1logo permitido de claims e inspecione os atributos mantidos pelo Chokepoint e observados no gateway.")),
                    React.createElement("button", { className: "button-subtle", onClick: () => this.setState({ sourceView: 'catalog' }) }, "\u2190 All sources")),
                React.createElement("section", { className: "source-catalog-panel" },
                    React.createElement("div", { className: "source-catalog-section-title" },
                        "IDP CLAIMS \u00B7 ALLOWLIST ",
                        this.help('idpclaims')),
                    React.createElement("p", { className: "helper-copy" }, "Escolha quais claims validadas s\u00E3o eleg\u00EDveis para condi\u00E7\u00F5es. A sele\u00E7\u00E3o n\u00E3o altera o IdP nem gera novos valores; em produ\u00E7\u00E3o ser\u00E1 necess\u00E1rio configurar seu mapeamento OIDC real."),
                    React.createElement("div", { className: "source-catalog-toolbar" },
                        React.createElement("div", { className: "field-search" },
                            React.createElement(Icon, { name: "search", size: 15 }),
                            React.createElement("input", { placeholder: "Search claims", value: s.idpClaimSearch, onChange: (e) => this.setState({ idpClaimSearch: e.target.value }) })),
                        React.createElement("span", null,
                            s.idpClaimSelection.length,
                            " selected")),
                    claims.filter(c => (c.id + c.name).toLowerCase().includes(s.idpClaimSearch.toLowerCase())).map(c => React.createElement("label", { key: c.id, className: "source-catalog-row" },
                        React.createElement("input", { type: "checkbox", checked: s.idpClaimSelection.includes(c.id), onChange: (e) => this.setState({ idpClaimSelection: e.target.checked ? [...s.idpClaimSelection, c.id] : s.idpClaimSelection.filter((x) => x !== c.id) }) }),
                        React.createElement("div", { className: "source-catalog-text" },
                            React.createElement("strong", null, c.name),
                            React.createElement("small", null,
                                React.createElement("code", null, c.id),
                                " \u00B7 ",
                                c.type,
                                " \u00B7 validated IdP claim")),
                        React.createElement("span", { className: "source-tile-status" }, s.idpClaimSelection.includes(c.id) ? 'Enabled' : 'Unavailable')))),
                React.createElement("section", { className: "source-catalog-panel" },
                    React.createElement("div", { className: "source-catalog-section-title" },
                        "AGENT REGISTRY ",
                        this.help('agentcontext')),
                    React.createElement("p", { className: "helper-copy" }, "Atributos pr\u00F3prios do tipo de agente, provenientes do registro local. N\u00E3o s\u00E3o claims do IdP."),
                    s.agents.slice(0, 12).map(a => React.createElement("div", { className: "source-catalog-row", key: a.id },
                        React.createElement("span", { className: "source-catalog-icon" },
                            React.createElement(Icon, { name: "zap" })),
                        React.createElement("div", { className: "source-catalog-text" },
                            React.createElement("strong", null, a.name),
                            React.createElement("small", null,
                                "agent.id = ",
                                a.id,
                                " \u00B7 environment = ",
                                a.environment,
                                " \u00B7 status = ",
                                a.status)),
                        React.createElement("button", { className: "button-subtle", onClick: () => this.go('workspace', { selectedAgent: a.id, section: 'capabilities' }) },
                            "Manage agent ",
                            React.createElement(Icon, { name: "arrow", size: 13 }))))),
                React.createElement("section", { className: "source-catalog-panel" },
                    React.createElement("div", { className: "source-catalog-section-title" },
                        "GATEWAY / PEP REQUEST FACTS ",
                        this.help('gatewaycontext')),
                    [{ name: 'tool.name', detail: 'Nome da tool chamada em tools/call' }, { name: 'request.environment', detail: 'Ambiente observado na fronteira' }, { name: 'request.channel', detail: 'Canal da requisição fornecido por integração confiável' }, { name: 'tool.arguments', detail: 'Argumentos MCP interceptados — não são fatos externos verificados' }].map(f => React.createElement("div", { className: "source-catalog-row", key: f.name },
                        React.createElement("span", { className: "source-catalog-icon" },
                            React.createElement(Icon, { name: "shield" })),
                        React.createElement("div", { className: "source-catalog-text" },
                            React.createElement("strong", null, f.name),
                            React.createElement("small", null, f.detail)),
                        React.createElement("span", { className: "source-tile-status good" }, "Observed"))),
                    React.createElement("div", { className: "source-architecture-note" },
                        React.createElement(Icon, { name: "shield", size: 18 }),
                        React.createElement("div", null,
                            React.createElement("strong", null, "Runtime not connected"),
                            React.createElement("p", null, "Esta p\u00E1gina mostra o contrato e os dados demonstrativos. Para uso real, o gateway/SDK precisa autenticar o principal e transmitir os valores ao Context Resolver.")))));
        }
        if (s.sourceView === 'detail' && src)
            return React.createElement("div", { className: "sources-page page-fade" },
                this.renderAccessNav(),
                React.createElement("div", { className: "sources-heading" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "eyebrow" }, "CONTEXT SOURCES / OPENAPI"),
                        React.createElement("h1", null,
                            src.name,
                            " ",
                            this.help('openapi')),
                        React.createElement("p", null,
                            src.baseUrl || 'No base URL',
                            " \u00B7 ",
                            src.operations.length,
                            " GET operations \u00B7 ",
                            s.bindings.filter((b) => b.sourceId === src.id).length,
                            " bindings")),
                    React.createElement("button", { className: "button-subtle", onClick: () => this.setState({ sourceView: 'catalog' }) }, "\u2190 All sources")),
                React.createElement("section", { className: "source-catalog-panel" },
                    React.createElement("div", { className: "source-catalog-section-title" }, "DISCOVERED OPERATIONS"),
                    src.operations.map((operation) => React.createElement("div", { key: operation.key, className: "source-catalog-operation" },
                        React.createElement("button", { className: "source-catalog-operation-head", onClick: () => this.pickOperation(operation.key) },
                            React.createElement("strong", null, operation.key),
                            React.createElement("span", null,
                                operation.fields.length,
                                " fields ",
                                s.sourceOperation === operation.key ? '▴' : '▾')),
                        s.sourceOperation === operation.key && React.createElement("div", { className: "source-catalog-fields" }, operation.fields.map((f) => React.createElement("div", { key: f.path },
                            React.createElement("code", null, f.path),
                            React.createElement("span", null, f.options ? 'enum · ' + f.options.join(', ') : f.kind))))))),
                React.createElement("section", { className: "source-catalog-panel" },
                    React.createElement("div", { className: "source-catalog-section-title" },
                        "BINDINGS FOR THIS SOURCE ",
                        this.help('bindings')),
                    s.bindings.filter((b) => b.sourceId === src.id).map((b) => React.createElement("div", { className: "source-catalog-row", key: b.id },
                        React.createElement("span", { className: "source-catalog-icon" },
                            React.createElement(Icon, { name: "filter", size: 18 })),
                        React.createElement("div", { className: "source-catalog-text" },
                            React.createElement("strong", null,
                                b.toolId,
                                " \u2192 ",
                                b.fieldPath),
                            React.createElement("small", null,
                                b.operationKey,
                                " \u00B7 ",
                                Object.entries(b.pathMap).map(([k, v]) => '{' + k + '} ← ' + v).join(' · '))),
                        React.createElement("button", { className: "icon-button", onClick: () => this.removeBinding(b.id), title: "Remove binding" },
                            React.createElement(Icon, { name: "trash", size: 15 })))),
                    !s.bindings.some((b) => b.sourceId === src.id) && React.createElement("div", { className: "source-catalog-empty" }, "No bindings for this API yet."),
                    React.createElement("button", { className: "button-primary", onClick: () => this.setState({ sourceView: 'import', inspectionOpen: true }) },
                        "Configure field mapping ",
                        React.createElement(Icon, { name: "arrow", size: 14 }))));
        return React.createElement("div", { className: "sources-page page-fade" },
            this.renderAccessNav(),
            React.createElement("div", { className: "sources-heading" },
                React.createElement("div", null,
                    React.createElement("div", { className: "eyebrow" }, "ACCESS / CONTEXT SOURCES"),
                    React.createElement("h1", null,
                        "Import & map context ",
                        this.help("sources")),
                    React.createElement("p", null, "Import a contract, select a trusted read operation, and map its response to a tool. No invented attributes.")),
                React.createElement("button", { className: "button-subtle", onClick: () => this.setState({ sourceView: 'catalog' }) }, "\u2190 All sources")),
            React.createElement("div", { className: "source-split" },
                React.createElement("section", { className: "source-panel" },
                    React.createElement("div", { className: "source-panel-header" },
                        React.createElement("span", { className: "scope-step" }, "01 / IMPORT CONTRACT"),
                        React.createElement("h2", null,
                            "Bring an API schema ",
                            this.help("import")),
                        React.createElement("p", null, "Paste OpenAPI 3.x JSON or select a local .json file. Reading the schema never calls the API.")),
                    React.createElement("div", { className: "source-import-switch" },
                        React.createElement("button", { className: s.sourceImportMode === 'file' ? 'active' : '', onClick: () => this.setState({ sourceImportMode: 'file' }) }, "Upload / paste JSON"),
                        React.createElement("button", { className: s.sourceImportMode === 'url' ? 'active' : '', onClick: () => this.setState({ sourceImportMode: 'url' }) }, "Import via endpoint")),
                    s.sourceImportMode === 'url' ? React.createElement("div", { className: "source-url-box" },
                        React.createElement("label", null, "OpenAPI schema URL \u00B7 HTTPS \u00B7 public/CORS-enabled endpoint"),
                        React.createElement("div", null,
                            React.createElement("input", { "aria-label": "OpenAPI endpoint URL", type: "url", placeholder: "https://api.example.com/openapi.json", value: s.sourceUrl, onChange: (e) => this.setState({ sourceUrl: e.target.value }) }),
                            React.createElement("button", { className: "button-primary", disabled: !s.sourceUrl.trim(), onClick: this.importFromUrl }, "Fetch & inspect")),
                        React.createElement("small", null, "Browser demo fetches JSON directly (subject to CORS). No credentials are sent. Production must use a secured backend importer.")) : React.createElement("div", { className: "source-spec-top" },
                        React.createElement("button", { className: "button-subtle", onClick: this.loadExample },
                            React.createElement(Icon, { name: "beaker", size: 14 }),
                            " Load Orders API example"),
                        React.createElement("label", { className: "source-file" },
                            React.createElement(Icon, { name: "plus", size: 14 }),
                            " Upload JSON",
                            React.createElement("input", { type: "file", accept: ".json,application/json", onChange: (e) => { var _a; const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0]; if (!file)
                                    return; const reader = new FileReader(); reader.onload = () => this.setState({ sourceSpec: String(reader.result || ''), sourceDraft: null, sourceError: '', sourceTest: null }); reader.readAsText(file); } }))),
                    React.createElement("textarea", { className: "source-spec-input", style: { display: s.sourceImportMode === 'url' ? 'none' : undefined }, "aria-label": "OpenAPI JSON specification", placeholder: '{\n  "openapi": "3.1.0",\n  "paths": { ... }\n}', spellCheck: false, value: s.sourceSpec, onChange: (e) => this.setState({ sourceSpec: e.target.value, sourceError: '', sourceDraft: null, sourceTest: null }) }),
                    s.sourceError && React.createElement("div", { className: "source-validation-error" },
                        React.createElement(Icon, { name: "alert", size: 15 }),
                        s.sourceError),
                    React.createElement("button", { className: "button-primary", disabled: !s.sourceSpec.trim(), onClick: this.importSpec },
                        "Inspect schema ",
                        React.createElement(Icon, { name: "arrow", size: 14 })),
                    src && React.createElement("div", { className: "source-parsed" },
                        React.createElement(Icon, { name: "circlecheck", size: 17 }),
                        React.createElement("div", null,
                            React.createElement("strong", null, src.name),
                            React.createElement("span", null,
                                src.operations.length,
                                " GET operation(s) with typed JSON response \u00B7 ",
                                src.baseUrl || 'no server URL'))),
                    src && s.inspectionOpen && React.createElement("div", { className: "inspection-result", role: "region", "aria-label": "Schema inspection results" },
                        React.createElement("div", { className: "inspection-result-head" },
                            React.createElement("div", null,
                                React.createElement("strong", null,
                                    "Schema inspected \u00B7 ",
                                    src.name),
                                React.createElement("small", null,
                                    src.operations.length,
                                    " read operations \u00B7 ",
                                    src.operations.reduce((n, o) => n + o.fields.length, 0),
                                    " discoverable attributes")),
                            React.createElement("button", { className: "button-subtle", onClick: () => this.setState({ inspectionOpen: false }) }, "Collapse")),
                        React.createElement("div", { className: "inspection-result-ops" }, src.operations.map((operation) => React.createElement("button", { key: operation.key, className: operation.key === s.sourceOperation ? 'active' : '', onClick: () => this.pickOperation(operation.key) },
                            React.createElement("b", null, operation.key),
                            React.createElement("span", null,
                                operation.fields.length,
                                " fields")))),
                        React.createElement("div", { className: "inspection-result-fields" }, fields.map((f) => React.createElement("button", { key: f.path, className: f.path === s.sourceField ? 'active' : '', onClick: () => this.setState({ sourceField: f.path, sourceTest: null }) },
                            React.createElement("code", null, f.path),
                            React.createElement("span", null, f.options ? 'enum · ' + f.options.join(', ') : f.kind)))),
                        React.createElement("div", { className: "inspection-result-test" },
                            React.createElement("button", { className: "button-primary", disabled: !s.sourceSample.trim() || !s.sourceField, onClick: this.testSample },
                                React.createElement(Icon, { name: "beaker", size: 14 }),
                                " Simulate extract from sample"),
                            React.createElement("small", null, s.sourceSample.trim() ? 'Runs locally against the example response below.' : 'Paste a sample JSON response in “Try a sample” to simulate extraction.')),
                        s.sourceTest && React.createElement("div", { className: s.sourceTest.ok ? 'inspection-result-ok' : 'inspection-result-failed', role: "status" }, s.sourceTest.ok ? 'Extracted value: ' + s.sourceTest.value : 'Extraction failed: ' + s.sourceTest.value))),
                React.createElement("section", { className: "source-panel" },
                    React.createElement("div", { className: "source-panel-header" },
                        React.createElement("span", { className: "scope-step" }, "02 / MAP CONTEXT"),
                        React.createElement("h2", null,
                            "Resolve a value for a tool ",
                            this.help("openapi")),
                        React.createElement("p", null, "Map the URL parameters, then choose which response field may be evaluated by a condition.")),
                    !src ? React.createElement("div", { className: "source-await" },
                        React.createElement(Icon, { name: "link", size: 26 }),
                        React.createElement("strong", null, "Start with the schema"),
                        React.createElement("span", null, "We\u2019ll show the read operations and attributes inferred from its response types.")) : React.createElement("div", { className: "source-context-mapping" },
                        React.createElement("div", { className: "source-form-row" },
                            React.createElement("label", null, "Read operation (PIP)"),
                            React.createElement("select", { "aria-label": "Read operation", value: s.sourceOperation, onChange: (e) => this.pickOperation(e.target.value) }, src.operations.map((o) => React.createElement("option", { key: o.key, value: o.key },
                                o.key,
                                " \u00B7 ",
                                o.summary)))),
                        React.createElement("div", { className: "source-form-row" },
                            React.createElement("label", null, "Tool protected by this context"),
                            React.createElement("select", { "aria-label": "Protected tool", value: s.sourceTool, onChange: (e) => this.setState({ sourceTool: e.target.value, sourcePathMap: {}, sourceTest: null }) }, s.tools.map((t) => React.createElement("option", { key: t.id, value: t.id },
                                t.id,
                                " \u00B7 ",
                                t.server)))),
                        !!(op === null || op === void 0 ? void 0 : op.pathParams.length) && React.createElement("div", { className: "source-params" },
                            React.createElement("div", { className: "source-mini-heading" }, "URL parameter mapping"),
                            op.pathParams.map((param) => React.createElement("div", { className: "source-param-row", key: param },
                                React.createElement("code", null, '{' + param + '}'),
                                React.createElement(Icon, { name: "arrow", size: 13 }),
                                React.createElement("select", { "aria-label": 'Map URL parameter ' + param, value: s.sourcePathMap[param] || '', onChange: (e) => this.setState({ sourcePathMap: { ...s.sourcePathMap, [param]: e.target.value }, sourceTest: null }) },
                                    React.createElement("option", { value: "" }, "Select MCP argument\u2026"),
                                    args.map(a => React.createElement("option", { value: a.id, key: a.id }, a.id)))))),
                        React.createElement("div", { className: "source-form-row" },
                            React.createElement("label", null, "Response field"),
                            React.createElement("select", { "aria-label": "Response field", value: s.sourceField, onChange: (e) => this.setState({ sourceField: e.target.value, sourceTest: null }) }, fields.map((f) => React.createElement("option", { value: f.path, key: f.path },
                                f.path,
                                " \u00B7 ",
                                f.kind,
                                f.options ? ' (enum)' : '')))),
                        React.createElement("div", { className: "source-schema-fields" },
                            React.createElement("span", { className: "source-mini-heading" },
                                "DISCOVERED FIELDS \u00B7 ",
                                fields.length),
                            React.createElement("div", null, fields.map((f) => React.createElement("button", { key: f.path, className: f.path === s.sourceField ? 'selected' : '', onClick: () => this.setState({ sourceField: f.path, sourceTest: null }) },
                                React.createElement("code", null, f.path),
                                React.createElement("span", null, f.options ? 'enum · ' + f.options.join(' / ') : f.kind))))),
                        React.createElement("div", { className: "source-form-actions" },
                            React.createElement("button", { className: "button-primary", disabled: !s.sourceField || (op === null || op === void 0 ? void 0 : op.pathParams.some((v) => !s.sourcePathMap[v])), onClick: this.saveMapping },
                                React.createElement(Icon, { name: "check", size: 15 }),
                                " Save field mapping"),
                            React.createElement("small", null, "Schema mapping only \u00B7 live HTTP resolution requires a backend connector."))))),
            React.createElement("div", { className: "source-bottom" },
                React.createElement("section", { className: "source-panel" },
                    React.createElement("div", { className: "source-panel-header" },
                        React.createElement("span", { className: "scope-step" }, "03 / TRY A SAMPLE"),
                        React.createElement("h2", null,
                            "Test field extraction ",
                            this.help("extraction")),
                        React.createElement("p", null,
                            "Paste a response JSON example. This validates your field path \u2014 ",
                            React.createElement("strong", null, "not"),
                            " API credentials or the truth of the data.")),
                    React.createElement("textarea", { "aria-label": "Example JSON response", className: "source-sample-input", placeholder: '{ "id": "ord_142", "status": "pending" }', value: s.sourceSample, onChange: (e) => this.setState({ sourceSample: e.target.value, sourceTest: null }) }),
                    React.createElement("div", { className: "source-sample-bottom" },
                        React.createElement("button", { className: "button-subtle", disabled: !src || !s.sourceSample.trim(), onClick: this.testSample },
                            React.createElement(Icon, { name: "beaker", size: 15 }),
                            " Extract sample field"),
                        s.sourceTest && React.createElement("span", { className: s.sourceTest.ok ? 'source-result-ok' : 'source-result-bad' }, s.sourceTest.ok ? 'Extracted: ' + s.sourceTest.value : s.sourceTest.value))),
                React.createElement("section", { className: "source-panel" },
                    React.createElement("div", { className: "source-panel-header" },
                        React.createElement("span", { className: "scope-step" }, "MAPPINGS / AVAILABLE TO POLICIES"),
                        React.createElement("h2", null,
                            "Context bindings ",
                            React.createElement("span", { className: "source-count" }, s.bindings.length),
                            " ",
                            this.help("bindings")),
                        React.createElement("p", null, "Only mapped fields appear in the visual builder and CEL suggestions for their assigned tool.")),
                    !s.bindings.length ? React.createElement("div", { className: "source-empty-bindings" },
                        "No context bindings yet. This list will show the protected tool, read operation, response field and URL parameter mapping.  Start by importing the Orders API example, then map ",
                        React.createElement("code", null,
                            "GET /orders/",
                            '{id}'),
                        " to ",
                        React.createElement("code", null, "orders.cancel"),
                        ".") : React.createElement("div", { className: "binding-list" }, s.bindings.filter((b) => { const src = s.sources.find((x) => x.id === b.sourceId); return (b.toolId + ' ' + (src === null || src === void 0 ? void 0 : src.name) + ' ' + b.fieldPath).toLowerCase().includes(s.sourceSearch.toLowerCase()); }).map((b) => { const provider = s.sources.find((x) => x.id === b.sourceId), operation = provider === null || provider === void 0 ? void 0 : provider.operations.find((o) => o.key === b.operationKey); return React.createElement("div", { className: "binding-item", key: b.id },
                        React.createElement("div", null,
                            React.createElement("strong", null, b.toolId),
                            React.createElement("small", null,
                                provider === null || provider === void 0 ? void 0 :
                                    provider.name,
                                " / ",
                                React.createElement("code", null, operation === null || operation === void 0 ? void 0 : operation.key)),
                            React.createElement("span", null,
                                "Field ",
                                React.createElement("code", null, b.fieldPath),
                                " \u00B7 ",
                                Object.keys(b.pathMap).map(key => '{' + key + '} ← ' + b.pathMap[key]).join(' · '))),
                        React.createElement("div", { className: "binding-actions" },
                            React.createElement("button", { title: "Edit conditions for this tool", onClick: () => { const a = s.agents.find((agent) => this.has('capability', agent.id, b.toolId)); this.go('workspace', { selectedAgent: (a === null || a === void 0 ? void 0 : a.id) || 'orderops', selectedTool: b.toolId }); this.openConditions((a === null || a === void 0 ? void 0 : a.id) || 'orderops', b.toolId); } },
                                React.createElement(Icon, { name: "edit", size: 14 })),
                            React.createElement("button", { title: "Remove context mapping", onClick: () => this.removeBinding(b.id) },
                                React.createElement(Icon, { name: "trash", size: 14 })))); })),
                    !!s.bindings.length && React.createElement("div", { className: "source-filter" },
                        React.createElement(Icon, { name: "search", size: 14 }),
                        React.createElement("input", { placeholder: "Filter mappings\u2026", value: s.sourceSearch, onChange: (e) => this.setState({ sourceSearch: e.target.value }) })))),
            React.createElement("div", { className: "source-architecture-note" },
                React.createElement(Icon, { name: "shield", size: 18 }),
                React.createElement("div", null,
                    React.createElement("strong", null, "Runtime boundary"),
                    React.createElement("p", null, "The browser demonstrates schema discovery and bindings. In production, a trusted Chokepoint Context Resolver authenticates to the allowed API, reads and verifies the response, supplies typed values to OpenFGA Check, and fails closed when required data is unavailable. No live external calls or secrets are handled here."))));
    }
    renderWorkspace() {
        const s = this.state, agent = this.findAgent(s.selectedAgent), matches = s.agents.filter((a) => (a.name + ' ' + a.description).toLowerCase().includes(s.agentSearch.toLowerCase()));
        const shown = s.showAllAgents ? matches : matches.slice(0, 9);
        const grantedCount = s.tools.filter((t) => this.has('capability', agent.id, t.id)).length;
        const members = s.users.filter((u) => this.has('member', agent.id, u.id));
        const visibleTools = s.tools.filter((t) => (t.id + ' ' + t.description + ' ' + t.server).toLowerCase().includes(s.toolSearch.toLowerCase()) && (!s.readOnlyFilter || this.has('capability', agent.id, t.id)));
        return React.createElement("div", { className: "work-container page-fade" },
            this.renderAccessNav(),
            React.createElement("div", { className: "work-header" },
                React.createElement("div", null,
                    React.createElement("div", { className: "eyebrow" },
                        "ACCESS WORKBENCH ",
                        React.createElement("span", { className: "breadcrumb" },
                            "/ ",
                            agent.name)),
                    React.createElement("h1", null,
                        "Configure. Teste. Publique. ",
                        this.help("access")),
                    React.createElement("p", null, "Permiss\u00F5es como capacidades do agente \u2014 n\u00E3o como tuples.")),
                React.createElement("div", { className: "work-header-actions" },
                    React.createElement("button", { className: "button-subtle", onClick: () => this.setState({ modal: 'agent' }) },
                        React.createElement(Icon, { name: "plus", size: 16 }),
                        " New agent"),
                    React.createElement("button", { className: "button-dark", onClick: () => this.setState({ pendingView: true }) },
                        "Review changes ",
                        (s.pending.length + Object.keys(s.policyDrafts).length) > 0 && React.createElement("span", { className: "number-on-dark" }, s.pending.length + Object.keys(s.policyDrafts).length)))),
            React.createElement("div", { className: "workbench" },
                React.createElement("aside", { className: "agent-rail" },
                    React.createElement("div", { className: "rail-top" },
                        React.createElement("div", { className: "rail-label" },
                            "AGENT TYPES ",
                            React.createElement("span", null, s.agents.length)),
                        React.createElement("div", { className: "field-search" },
                            React.createElement(Icon, { name: "search", size: 15 }),
                            React.createElement("input", { "aria-label": "Find agent", placeholder: "Find an agent\u2026", value: s.agentSearch, onChange: (e) => this.setState({ agentSearch: e.target.value, showAllAgents: false }) }))),
                    React.createElement("div", { className: "agent-list" },
                        shown.map((a) => React.createElement("button", { className: classNames('agent-item', s.selectedAgent === a.id && 'active'), key: a.id, onClick: () => this.setState({ selectedAgent: a.id, selectedTool: (s.tools.find((t) => this.has('capability', a.id, t.id)) || s.tools[0]).id, selectedUser: (s.users.find((u) => this.has('member', a.id, u.id)) || s.users[0]).id, section: 'capabilities', simResult: null, toolSearch: '' }) },
                            React.createElement("span", { className: "agent-avatar" }, initials(a.name)),
                            React.createElement("span", { className: "agent-info" },
                                React.createElement("strong", null, a.name),
                                React.createElement("small", null, a.description)),
                            s.selectedAgent === a.id && React.createElement(Icon, { name: "chevron", size: 15 }))),
                        !shown.length && React.createElement("div", { className: "rail-empty" }, "No agents found."),
                        matches.length > 9 && React.createElement("button", { className: "showmore", onClick: () => this.setState({ showAllAgents: !s.showAllAgents }) },
                            s.showAllAgents ? 'Show fewer' : `Browse ${matches.length - 9} more`,
                            " ",
                            React.createElement(Icon, { name: "down", size: 14 }))),
                    React.createElement("div", { className: "rail-bottom" },
                        React.createElement("span", { className: "small-status" },
                            React.createElement("span", { className: "status-dot" }),
                            " Identity provider connected"),
                        React.createElement("button", { onClick: () => this.go('catalog', { catalogType: 'people' }) },
                            "People ",
                            React.createElement(Icon, { name: "arrow", size: 14 })))),
                React.createElement("section", { className: "agent-editor" },
                    React.createElement("div", { className: "agent-editor-top" },
                        React.createElement("div", { className: "agent-primary" },
                            React.createElement("div", { className: "agent-large" }, initials(agent.name)),
                            React.createElement("div", null,
                                React.createElement("div", { className: "agent-title-row" },
                                    React.createElement("h2", null, agent.name),
                                    React.createElement("span", { className: classNames('state-tag', agent.status === 'draft' && 'state-draft') }, agent.status)),
                                React.createElement("p", null, agent.description),
                                React.createElement("div", { className: "agent-meta" },
                                    React.createElement("span", null,
                                        React.createElement(Icon, { name: "users", size: 14 }),
                                        members.length,
                                        " people"),
                                    React.createElement("span", null,
                                        React.createElement(Icon, { name: "layers", size: 14 }),
                                        grantedCount,
                                        " capabilities"),
                                    React.createElement("span", null,
                                        React.createElement(Icon, { name: "code", size: 14 }),
                                        agent.environment)))),
                        React.createElement("button", { className: "icon-button", title: "Edit agent", onClick: () => this.setState({ modal: 'editagent' }) },
                            React.createElement(Icon, { name: "edit", size: 17 }))),
                    React.createElement("div", { className: "editor-tabs" },
                        React.createElement("button", { className: s.section === 'capabilities' ? 'tab-active' : '', onClick: () => this.setState({ section: 'capabilities' }) },
                            "Capabilities ",
                            React.createElement("span", null, grantedCount)),
                        React.createElement("button", { className: s.section === 'people' ? 'tab-active' : '', onClick: () => this.setState({ section: 'people' }) },
                            "People ",
                            React.createElement("span", null, members.length))),
                    s.section === 'capabilities' ? React.createElement("div", { className: "capability-editor" },
                        React.createElement("div", { className: "editor-toolbar" },
                            React.createElement("div", null,
                                React.createElement("h3", null, "What can this agent do?"),
                                React.createElement("p", null, "Grant access by tool. Conditions use mapped context sources.")),
                            React.createElement("button", { className: "button-subtle", onClick: () => this.go('sources', { sourceTool: s.selectedTool }) },
                                React.createElement(Icon, { name: "link", size: 14 }),
                                " Context sources")),
                        React.createElement("div", { className: "controls-row" },
                            React.createElement("div", { className: "field-search cap-search" },
                                React.createElement(Icon, { name: "search", size: 16 }),
                                React.createElement("input", { placeholder: "Search across every tool\u2026", value: s.toolSearch, onChange: (e) => this.setState({ toolSearch: e.target.value }) })),
                            React.createElement("button", { className: classNames('chip', s.readOnlyFilter && 'chip-selected'), onClick: () => this.setState({ readOnlyFilter: !s.readOnlyFilter }) },
                                "Granted only ",
                                React.createElement(Icon, { name: "filter", size: 14 }))),
                        React.createElement("div", { className: "server-groups" },
                            groupServers.map((server) => { const tools = visibleTools.filter((t) => t.server === server); if (!tools.length)
                                return null; const count = tools.filter((t) => this.has('capability', agent.id, t.id)).length; return React.createElement("div", { className: "server-group", key: server },
                                React.createElement("div", { className: "server-head" },
                                    React.createElement("div", null,
                                        React.createElement("span", { className: "server-icon" },
                                            React.createElement(Icon, { name: "server", size: 16 })),
                                        React.createElement("strong", null, server),
                                        React.createElement("small", null,
                                            count,
                                            " of ",
                                            tools.length,
                                            " enabled")),
                                    React.createElement("button", { onClick: () => { tools.filter(t => t.risk === 'read').forEach((t) => this.stage('capability', agent.id, t.id, true)); } },
                                        "Grant read-only ",
                                        React.createElement(Icon, { name: "plus", size: 13 }))),
                                React.createElement("div", { className: "tool-rows" }, tools.map((t) => { const ok = this.has('capability', agent.id, t.id), different = ok !== this.base('capability', agent.id, t.id); return React.createElement("div", { key: t.id, "data-tool": t.id, className: classNames('tool-line', different && 'modified', s.focusTool === t.id && 'tool-focus') },
                                    React.createElement("span", { className: "tool-kind" },
                                        React.createElement(Icon, { name: t.risk === 'read' ? 'eye' : t.risk === 'sensitive' ? 'shield' : 'edit', size: 15 })),
                                    React.createElement("div", { className: "tool-main" },
                                        React.createElement("code", null, t.id),
                                        React.createElement("small", null,
                                            t.description,
                                            t.approved === false && !s.reviewed && React.createElement("em", { className: "new-tag" }, "Unreviewed"))),
                                    React.createElement("span", { className: classNames('risk-tag', t.risk) }, t.risk === 'read' ? 'Read' : t.risk === 'write' ? 'Write' : 'Sensitive'),
                                    React.createElement("button", { className: classNames('condition-action', this.applicableRules(agent.id, s.selectedUser, t.id).length > 0 && 'has-conditions'), onClick: () => { this.setState({ selectedTool: t.id }); this.openConditions(agent.id, t.id); }, title: 'Configure contextual rules for ' + t.id },
                                        React.createElement(Icon, { name: "filter", size: 13 }),
                                        this.applicableRules(agent.id, s.selectedUser, t.id).length ? `${this.applicableRules(agent.id, s.selectedUser, t.id).length} scopes` : 'Conditions'),
                                    React.createElement("button", { role: "switch", "aria-checked": ok, "aria-label": `${ok ? 'Revoke' : 'Grant'} ${t.id}`, title: ok ? 'Revoke' : 'Grant', className: classNames('switch', ok && 'on'), onClick: () => this.stage('capability', agent.id, t.id) },
                                        React.createElement("span", null))); }))); }),
                            visibleTools.length === 0 && React.createElement("div", { className: "empty-result" },
                                "No tools match this search. ",
                                React.createElement("button", { onClick: () => this.setState({ toolSearch: '', readOnlyFilter: false }) }, "Clear filters")))) :
                        React.createElement("div", { className: "people-editor" },
                            React.createElement("div", { className: "editor-toolbar" },
                                React.createElement("div", null,
                                    React.createElement("h3", null, "Who can use this agent?"),
                                    React.createElement("p", null, "Associations use identities from your connected IdP."))),
                            React.createElement("div", { className: "field-search people-search" },
                                React.createElement(Icon, { name: "search", size: 16 }),
                                React.createElement("input", { placeholder: "Find user or email\u2026", value: s.memberSearch, onChange: (e) => this.setState({ memberSearch: e.target.value }) })),
                            React.createElement("div", { className: "member-rows" }, s.users.filter((u) => (u.name + ' ' + u.email).toLowerCase().includes(s.memberSearch.toLowerCase())).map((u) => { const assigned = this.has('member', agent.id, u.id); return React.createElement("div", { className: "member-row", key: u.id },
                                React.createElement("span", { className: "person-circle" }, initials(u.name)),
                                React.createElement("div", null,
                                    React.createElement("strong", null, u.name),
                                    React.createElement("small", null,
                                        u.email,
                                        " ",
                                        React.createElement("span", { className: "member-team" },
                                            "\u00B7 ",
                                            u.team))),
                                u.status === 'disabled' ? React.createElement("span", { className: "danger-text" }, "Disabled in IdP") : null,
                                React.createElement("button", { className: classNames('assign-button', assigned && 'assigned'), onClick: () => this.stage('member', agent.id, u.id) }, assigned ? React.createElement("span", { className: "assign-content" },
                                    React.createElement(Icon, { name: "check", size: 14 }),
                                    " Assigned") : React.createElement("span", { className: "assign-content" },
                                    React.createElement(Icon, { name: "plus", size: 14 }),
                                    " Assign"))); })))),
                React.createElement("aside", { className: "inspector" },
                    React.createElement("div", { className: "inspector-head" },
                        React.createElement("span", { className: "eyebrow" }, "EVALUATION LAB"),
                        React.createElement("span", { className: "demo-dot" },
                            React.createElement("span", null),
                            " Sandbox")),
                    React.createElement("h3", null,
                        "Would this be allowed? ",
                        this.help("sandbox")),
                    React.createElement("p", null, "Try a sample decision, including your unpublished rules."),
                    React.createElement("label", null, "User"),
                    React.createElement("select", { value: s.selectedUser, onChange: (e) => this.setState({ selectedUser: e.target.value, simResult: null }) }, s.users.map((u) => React.createElement("option", { key: u.id, value: u.id },
                        u.name,
                        u.status === 'disabled' ? ' · disabled' : ''))),
                    React.createElement("label", null, "Agent"),
                    React.createElement("div", { className: "readonly-field" },
                        React.createElement(Icon, { name: "zap", size: 16 }),
                        agent.name),
                    React.createElement("label", null, "Tool"),
                    React.createElement("select", { value: s.selectedTool, onChange: (e) => this.setState({ selectedTool: e.target.value, simResult: null }) }, s.tools.map((t) => React.createElement("option", { key: t.id, value: t.id }, t.id))),
                    this.renderTestContext(),
                    React.createElement("label", { className: "inline-check" },
                        React.createElement("input", { type: "checkbox", checked: s.includeDraft, onChange: (e) => this.setState({ includeDraft: e.target.checked, simResult: null }) }),
                        " Include draft changes"),
                    React.createElement("button", { className: "button-primary evaluate-button", onClick: this.simulate },
                        React.createElement(Icon, { name: "beaker", size: 17 }),
                        " Evaluate access ",
                        React.createElement(Icon, { name: "arrow", size: 15 })),
                    s.simResult && React.createElement("div", { className: classNames('test-result', s.simResult.allowed ? 'result-allow' : 'result-deny') },
                        React.createElement("div", { className: "test-result-head" },
                            React.createElement("span", null,
                                React.createElement(Icon, { name: s.simResult.allowed ? 'check' : 'x', size: 15 }),
                                s.simResult.allowed ? 'ALLOW' : 'DENY'),
                            React.createElement("small", null, s.simResult.draft ? 'Including draft' : 'Published policy')),
                        React.createElement("p", null, s.simResult.reason),
                        React.createElement("div", { className: "checks-list" }, s.simResult.checks.map((c, i) => React.createElement("div", { className: "check-line", key: i },
                            React.createElement("span", { className: c.ok ? 'check-green' : 'check-red' },
                                React.createElement(Icon, { name: c.ok ? 'check' : 'x', size: 12 })),
                            React.createElement("span", null, c.label)))),
                        React.createElement("button", { className: "text-link", onClick: () => this.setState({ modal: 'path' }) },
                            "Explain relationship path ",
                            React.createElement(Icon, { name: "arrow", size: 14 }))),
                    !s.simResult && React.createElement("div", { className: "lab-hint" },
                        React.createElement(Icon, { name: "shield", size: 18 }),
                        React.createElement("p", null, "Local demonstration: identity, relations, and configurable typed conditions. No live PDP or MCP Server is called.")),
                    " ",
                    s.simResult && React.createElement("div", { className: "regression-save" },
                        React.createElement("div", { className: "section-kicker" },
                            "SAVE AS REGRESSION TEST ",
                            this.help('sandbox')),
                        React.createElement("p", null, "Capture this exact user, agent, tool and context as an expected result."),
                        React.createElement("div", { className: "regression-actions" },
                            React.createElement("button", { onClick: () => this.saveCurrentTest(true) }, "Expect ALLOW"),
                            React.createElement("button", { onClick: () => this.saveCurrentTest(false) }, "Expect DENY"))),
                    React.createElement("div", { className: "regression-suite" },
                        React.createElement("div", { className: "regression-suite-head" },
                            React.createElement("strong", null,
                                "Authorization tests ",
                                React.createElement("span", null, s.accessTests.length)),
                            React.createElement("button", { onClick: () => this.runTestSuite(true), disabled: !s.accessTests.length },
                                "Run all with draft ",
                                React.createElement(Icon, { name: "arrow", size: 13 }))),
                        React.createElement("p", null, "Reusable checks tied to relationships, conditions and fixtures."),
                        s.accessTests.map((t) => React.createElement("div", { className: "regression-case", key: t.id },
                            React.createElement("div", null,
                                React.createElement("strong", null, t.name),
                                React.createElement("small", null,
                                    t.toolId,
                                    " \u00B7 expected ",
                                    t.expected ? 'ALLOW' : 'DENY')),
                            React.createElement("button", { className: "icon-button", title: "Delete test", onClick: () => this.removeTest(t.id) },
                                React.createElement(Icon, { name: "close", size: 14 })))),
                        s.testSuiteResult && React.createElement("div", { className: s.testSuiteResult.failed ? 'suite-result fail' : 'suite-result pass' },
                            React.createElement("strong", null,
                                s.testSuiteResult.passed,
                                " passed \u00B7 ",
                                s.testSuiteResult.failed,
                                " failed"),
                            s.testSuiteResult.results.filter((r) => !r.pass).map((r) => React.createElement("small", { key: r.id },
                                r.name,
                                ": expected ",
                                r.expected ? 'ALLOW' : 'DENY',
                                ", got ",
                                r.actual ? 'ALLOW' : 'DENY',
                                " \u00B7 ",
                                r.reason))),
                        !s.accessTests.length && React.createElement("small", null, "No saved tests yet. Evaluate a decision and save an expectation.")))));
    }
    renderTestContext() {
        const s = this.state, policies = this.applicableRules(s.selectedAgent, s.selectedUser, s.selectedTool, s.includeDraft), attrs = this.attributes(s.selectedTool), used = [];
        policies.forEach(({ target, policy }) => { const available = this.attributesForScope(target); const checked = checkPolicy(policy, available); if (checked.ok)
            (checked.used || []).forEach(a => { if (!used.some(v => v.id === a.id))
                used.push(a); }); });
        return React.createElement("div", { className: "sandbox-context" },
            React.createElement("div", { className: "sandbox-context-title" },
                React.createElement("span", null,
                    "Test context \u00B7 ",
                    policies.length,
                    " matching ",
                    policies.length === 1 ? 'scope' : 'scopes'),
                React.createElement("button", { onClick: () => this.openConditions(s.selectedAgent, s.selectedTool) },
                    React.createElement(Icon, { name: "filter", size: 13 }),
                    " Configure scopes")),
            used.length ? used.map(a => { const key = s.selectedTool + '::' + a.id; const readOnly = a.source === 'identity' || a.source === 'agent'; const value = this.contextValue(a, this.findUser(s.selectedUser), this.findAgent(s.selectedAgent), s.selectedTool, { [a.id]: s.testInputs[s.selectedTool + '::' + a.id] !== undefined ? s.testInputs[s.selectedTool + '::' + a.id] : a.example || '' }); return React.createElement("div", { className: "context-field", key: a.id },
                React.createElement("label", null,
                    a.label,
                    React.createElement("span", null, a.source === 'provider' ? 'SIMULATED VALUE · ' + (a.origin || 'API mapping') : sourceLabels[a.source])),
                readOnly ? React.createElement("div", { className: "context-fixed" },
                    value,
                    " ",
                    React.createElement("span", null,
                        "From ",
                        a.source === 'identity' ? 'IdP' : 'agent registry')) : a.kind === 'choice' || a.kind === 'boolean' ? React.createElement("select", { value: value, onChange: (e) => this.setState((st) => ({ testInputs: { ...st.testInputs, [key]: e.target.value }, simResult: null })) }, (a.kind === 'boolean' ? ['true', 'false'] : (a.options || [])).map(v => React.createElement("option", { key: v, value: v }, v))) : React.createElement("input", { type: a.kind === 'number' ? 'number' : a.kind === 'date' ? 'date' : 'text', placeholder: a.example || 'Enter value', value: value, onChange: (e) => this.setState((st) => ({ testInputs: { ...st.testInputs, [key]: e.target.value }, simResult: null })) })); }) : React.createElement("div", { className: "context-empty" },
                "No context parameters required for this evaluation. ",
                React.createElement("button", { onClick: () => this.openConditions(s.selectedAgent, s.selectedTool) },
                    "Define a scoped condition ",
                    React.createElement(Icon, { name: "arrow", size: 13 }))),
            policies.length > 0 && React.createElement("div", { className: "scope-test-hint" }, "Matching restrictions are combined with AND. No condition can grant a missing relationship."));
    }
    renderConditionEditor() {
        var _a;
        const s = this.state, tool = this.findTool(s.conditionTool), target = this.scopeTarget(), policy = this.scopedPolicy(target, true) || { mode: 'all', clauses: [] }, attributes = this.attributesForScope(target), isDraft = Object.prototype.hasOwnProperty.call(s.policyDrafts, scopeKey(target)), rawMode = policy.editor === 'raw', expression = policyCel(policy, attributes), compiled = compileCel(expression, attributes), canVisual = celToClauses(expression, attributes) !== null, impact = this.scopeImpact(target), isAgentAll = !hasTool(target.scope);
        return React.createElement("div", { className: "modal-body conditions-body" },
            React.createElement("div", { className: "rules-intro" },
                React.createElement("span", { className: "policy-location" },
                    "Scope-aware authorization ",
                    React.createElement(Icon, { name: "chevron", size: 13 }),
                    " ",
                    React.createElement("code", null, tool.id)),
                React.createElement("p", null, "Decide who is affected first, then define the condition. A scoped rule can only restrict access, never grant it. All matching scopes are checked together.")),
            React.createElement("div", { className: "scope-card" },
                React.createElement("div", { className: "scope-head" },
                    React.createElement("div", null,
                        React.createElement("span", { className: "scope-step" }, "01 / APPLICABILITY"),
                        React.createElement("h3", null,
                            "Who does this rule apply to? ",
                            this.help("scope"))),
                    React.createElement("span", { className: "scope-default" }, "Restrictive \u00B7 AND")),
                React.createElement("div", { className: "scope-field" },
                    React.createElement("label", null, "Target scope"),
                    React.createElement("select", { "aria-label": "Policy applicability scope", value: s.conditionScope, onChange: (e) => this.setState({ conditionScope: e.target.value, rawChecked: false }) }, scopes.map(item => React.createElement("option", { value: item.id, key: item.id }, item.label))),
                    React.createElement("p", null, (_a = scopes.find(x => x.id === s.conditionScope)) === null || _a === void 0 ? void 0 : _a.detail)),
                React.createElement("div", { className: "scope-targets" },
                    hasAgent(target.scope) && React.createElement("div", null,
                        React.createElement("label", null, "Agent"),
                        React.createElement("select", { "aria-label": "Scope agent", value: s.conditionAgent, onChange: (e) => this.setState({ conditionAgent: e.target.value }) }, s.agents.map((a) => React.createElement("option", { key: a.id, value: a.id }, a.name)))),
                    hasTool(target.scope) && React.createElement("div", null,
                        React.createElement("label", null, "Tool"),
                        React.createElement("select", { "aria-label": "Scope tool", value: s.conditionTool, onChange: (e) => this.setState({ conditionTool: e.target.value }) }, s.tools.map((t) => React.createElement("option", { key: t.id, value: t.id }, t.id)))),
                    hasUser(target.scope) && React.createElement("div", null,
                        React.createElement("label", null, "User (from IdP)"),
                        React.createElement("select", { "aria-label": "Scope user", value: s.conditionUser, onChange: (e) => this.setState({ conditionUser: e.target.value }) }, s.users.map((u) => React.createElement("option", { key: u.id, value: u.id },
                            u.name,
                            " \u00B7 ",
                            u.email)))),
                    hasTeam(target.scope) && React.createElement("div", null,
                        React.createElement("label", null, "User team (IdP claim)"),
                        React.createElement("select", { "aria-label": "Scope team", value: s.conditionTeam, onChange: (e) => this.setState({ conditionTeam: e.target.value }) }, Array.from(new Set(s.users.map((u) => u.team))).map((team) => React.createElement("option", { key: team, value: team }, team))))),
                React.createElement("div", { className: "scope-preview" },
                    React.createElement("div", null,
                        React.createElement("strong", null, "Effective target"),
                        React.createElement("span", null, this.scopeSummary(target))),
                    React.createElement("div", { className: "scope-impact" },
                        React.createElement("span", null,
                            impact.users,
                            " people"),
                        React.createElement("span", null,
                            impact.tools,
                            " granted agent-tool pairs"))),
                React.createElement("div", { className: "scope-footnote" }, "Only currently granted paths are counted. Impact is a local estimate, not an OpenFGA Expand/ListUsers calculation.")),
            React.createElement("div", { className: "scope-editor-label" },
                React.createElement("span", { className: "scope-step" }, "02 / CONDITIONS"),
                React.createElement("strong", null,
                    "When is execution allowed? ",
                    this.help("conditions"))),
            React.createElement("div", { className: "cel-editor-toolbar" },
                React.createElement("div", { className: "editor-tabs" },
                    React.createElement("button", { className: !rawMode ? 'active' : '', onClick: () => this.switchEditor('visual') }, "Visual builder"),
                    React.createElement("button", { className: rawMode ? 'active' : '', onClick: () => this.switchEditor('raw') },
                        React.createElement(Icon, { name: "code", size: 15 }),
                        " CEL code")),
                React.createElement("div", { className: "exp-help-wrap" },
                    React.createElement("span", { className: "exp-label" },
                        "Dynamic Conditions ",
                        React.createElement("span", null, "EXPERIMENTAL")),
                    React.createElement("button", { className: "exp-help-icon", "aria-label": "About experimental OpenFGA Dynamic Conditions", "aria-expanded": s.showExperimentalHelp, onClick: () => this.setState({ showExperimentalHelp: !s.showExperimentalHelp }) },
                        React.createElement(Icon, { name: "help", size: 16 })))),
            s.showExperimentalHelp && React.createElement("div", { className: "experimental-help" },
                React.createElement("strong", null, "OpenFGA Dynamic Conditions \u2014 experimental"),
                React.createElement("p", null,
                    "Available starting in OpenFGA 1.21.0 with ",
                    React.createElement("code", null, "openfga run --experimentals inline_expressions"),
                    ". A tuple stores ",
                    React.createElement("code", null, "condition.name = \"$expression\""),
                    ", a CEL expression and declared parameter types. The Check request supplies trusted values. Syntax, API and tuple format can change. This prototype validates a limited CEL subset locally; the production backend must compile using OpenFGA/cel-go and enforce at the PEP."),
                React.createElement("a", { href: "https://openfga.dev/blog/dynamic-abac-expressions-announcement", target: "_blank", rel: "noreferrer" }, "OpenFGA documentation \u2197")),
            !rawMode && React.createElement("div", { className: "rules-mode" },
                React.createElement("span", null, "Allow only when"),
                React.createElement("select", { value: policy.mode, onChange: (e) => this.editPolicy(p => ({ ...p, mode: e.target.value })) },
                    React.createElement("option", { value: "all" }, "ALL conditions match"),
                    React.createElement("option", { value: "any" }, "ANY condition matches"))),
            rawMode && React.createElement("div", { className: "cel-raw-panel" },
                React.createElement("div", { className: "cel-code-top" },
                    React.createElement("span", null,
                        React.createElement(Icon, { name: "terminal", size: 15 }),
                        " CEL expression"),
                    React.createElement("span", null, "scoped relation \u00B7 tuple condition")),
                React.createElement("div", { className: "cel-editor-surface" },
                    React.createElement("div", { className: "cel-lines" }, expression.split('\n').map((_, i) => React.createElement("span", { key: i }, i + 1))),
                    React.createElement("textarea", { spellCheck: false, "aria-label": "CEL raw expression", autoCapitalize: "off", autoComplete: "off", value: expression, onChange: (e) => this.editRaw(e.target.value), placeholder: 'arguments_approvals >= 2 && identity_team == "Engineering"' })),
                React.createElement("div", { className: compiled.ok ? 'cel-status valid' : 'cel-status invalid' },
                    React.createElement(Icon, { name: compiled.ok ? 'check' : 'alert', size: 16 }),
                    React.createElement("span", null, compiled.ok ? 'Valid CEL subset · boolean result · ' + (compiled.used || []).length + ' typed parameter(s)' : compiled.error),
                    React.createElement("button", { className: "cel-validate", onClick: () => this.setState({ rawChecked: true }) }, s.rawChecked ? (compiled.ok ? 'Checked locally' : 'Check failed') : 'Check syntax')),
                React.createElement("div", { className: "cel-mapping" },
                    React.createElement("strong", null, "Available parameters \u00B7 typed from configured sources"),
                    React.createElement("button", { className: "cel-add-source", onClick: () => this.go('sources', { sourceTool: s.conditionTool }) },
                        React.createElement(Icon, { name: "link", size: 13 }),
                        " Add source"),
                    React.createElement("div", null, attributes.map((a) => React.createElement("button", { title: 'Insert ' + a.label, key: a.id, onClick: () => this.editRaw(expression + (expression.trim() ? ' && ' : '') + celVar(a) + (a.kind === 'boolean' ? ' == true' : a.kind === 'number' ? ' >= 1' : ' == "' + (a.example || 'value') + '"')) },
                        React.createElement("code", null, celVar(a)),
                        React.createElement("small", null, celParamType(a)))))),
                compiled.ok && React.createElement("details", { className: "cel-tuple-preview" },
                    React.createElement("summary", null, "OpenFGA tuple preview"),
                    React.createElement("pre", null, '# Conceptual mapping; backend resolves the selected scope\n# ' + this.scopeSummary(target) + '\n' + (target.scope === 'agent_tool' ? 'user: agent:' + target.agentId + '\nrelation: can_call\nobject: tool:' + tool.id.replace(/[^a-zA-Z0-9_]/g, '_') + '\n' : '# Composite scopes need a suitable relation/model and may require separate checks\n') + 'condition:\n  name: $expression\n  context:\n    expression: ' + JSON.stringify(expression) + '\n    parameters:\n' + (compiled.used || []).map(a => '      ' + celVar(a) + ': ' + celParamType(a)).join('\n')),
                    React.createElement("small", null, "Illustrative mapping, not a ready-to-write tuple for every scope. For combined scopes, Chokepoint must enforce intersection/AND explicitly: parallel OpenFGA grant tuples are OR, not AND. The backend must model the principal and validate with OpenFGA.")),
                !canVisual && React.createElement("p", { className: "cel-editor-note" }, "This expression is too complex for lossless conversion to the visual builder. It remains editable in CEL mode.")),
            !rawMode && React.createElement("div", { className: "visual-rules" },
                React.createElement("div", { className: "rules-stack" },
                    policy.clauses.map((c, i) => { const a = attributes.find(x => x.id === c.attrId) || attributes[0]; return React.createElement("div", { className: "rule-card", key: c.id },
                        React.createElement("div", { className: "rule-head" },
                            React.createElement("span", null,
                                "Condition ",
                                i + 1),
                            React.createElement("button", { title: "Remove condition", onClick: () => this.editPolicy(p => ({ ...p, clauses: p.clauses.filter(x => x.id !== c.id) })) },
                                React.createElement(Icon, { name: "trash", size: 15 }),
                                " Remove")),
                        React.createElement("label", null, "Attribute"),
                        React.createElement("select", { value: c.attrId, onChange: (e) => this.updateClause(c.id, { attrId: e.target.value }) }, Object.keys(sourceLabels).map(source => React.createElement("optgroup", { label: sourceLabels[source], key: source }, attributes.filter(x => x.source === source).map(x => React.createElement("option", { key: x.id, value: x.id }, x.label))))),
                        React.createElement("div", { className: "rule-values" },
                            React.createElement("div", null,
                                React.createElement("label", null, "Comparison"),
                                React.createElement("select", { value: c.operator, onChange: (e) => this.updateClause(c.id, { operator: e.target.value }) }, permittedOperators(a.kind).map(x => React.createElement("option", { value: x.id, key: x.id }, x.label)))),
                            React.createElement("div", null,
                                React.createElement("label", null, "Expected value"),
                                a.kind === 'choice' || a.kind === 'boolean' ? React.createElement("select", { value: c.value, onChange: (e) => this.updateClause(c.id, { value: e.target.value }) }, (a.kind === 'boolean' ? ['true', 'false'] : (a.options || [])).map(v => React.createElement("option", { value: v, key: v }, v))) : React.createElement("input", { type: a.kind === 'number' ? 'number' : a.kind === 'date' ? 'date' : 'text', value: c.value, placeholder: "Set a value", onChange: (e) => this.updateClause(c.id, { value: e.target.value }) }))),
                        React.createElement("div", { className: "rule-source" },
                            React.createElement(Icon, { name: "shield", size: 13 }),
                            sourceLabels[a.source],
                            a.source === 'provider' ? ' · requires live PIP (demo uses test fixtures)' : a.source === 'arguments' ? ' · request values are not verified resource facts' : a.source === 'runtime' ? ' · validated gateway data' : '')); }),
                    !policy.clauses.length && React.createElement("div", { className: "rule-empty" },
                        React.createElement(Icon, { name: "filter", size: 23 }),
                        React.createElement("strong", null, "No extra restrictions"),
                        React.createElement("span", null, "No additional restriction at this scope. Existing grants and other matching rules still apply."))),
                React.createElement("div", { className: "rules-add" },
                    React.createElement("button", { className: "button-subtle", onClick: this.addCondition, disabled: !attributes.length },
                        React.createElement(Icon, { name: "plus", size: 16 }),
                        " Add condition"),
                    React.createElement("button", { className: "text-link", onClick: () => this.go('sources', { sourceTool: s.conditionTool }) },
                        React.createElement(Icon, { name: "link", size: 15 }),
                        " Connect context source")),
                React.createElement("div", { className: "rule-context-discovery" },
                    React.createElement(Icon, { name: "shield", size: 16 }),
                    React.createElement("p", null,
                        React.createElement("strong", null, "Attributes come from an actual contract."),
                        " Tool arguments from MCP schemas, verified identity, or fields mapped from an OpenAPI read operation. You cannot create an unresolvable field here."),
                    React.createElement("button", { onClick: () => this.go('sources', { sourceTool: s.conditionTool }) },
                        "Manage sources ",
                        React.createElement(Icon, { name: "arrow", size: 13 })))),
            React.createElement("details", { className: "scope-context-provenance" },
                React.createElement("summary", null,
                    "Where do evaluation attributes come from? ",
                    React.createElement(Icon, { name: "help", size: 14 })),
                React.createElement("p", null,
                    React.createElement("b", null, "Identity:"),
                    " validated IdP token / directory \u00B7 ",
                    React.createElement("b", null, "Agent:"),
                    " verified runtime identity and registry \u00B7 ",
                    React.createElement("b", null, "Tool arguments:"),
                    " schema-validated call, with sensitive facts independently verified \u00B7 ",
                    React.createElement("b", null, "OpenAPI:"),
                    " explicitly mapped trusted PIP/backend \u00B7 ",
                    React.createElement("b", null, "Runtime:"),
                    " trusted gateway/PEP. The Chokepoint backend supplies their typed values to the OpenFGA ",
                    React.createElement("code", null, "Check.context"),
                    "; OpenFGA does not fetch them itself. A declared field is not automatically a trusted one.")),
            React.createElement("div", { className: "rules-footer" },
                React.createElement("div", null,
                    React.createElement("strong", null, rawMode ? 'CEL expression' : policy.clauses.length + ' ' + (policy.clauses.length === 1 ? 'condition' : 'conditions')),
                    React.createElement("span", null, !compiled.ok ? 'Fix validation errors before testing or publishing' : isDraft ? 'Unpublished · test with draft enabled' : 'Published rules · no changes')),
                React.createElement("button", { className: "button-subtle", disabled: !compiled.ok, onClick: () => { this.setState({ selectedAgent: s.conditionAgent, selectedTool: tool.id, includeDraft: true, modal: '', page: 'workspace', section: 'capabilities', simResult: null }); } },
                    React.createElement(Icon, { name: "beaker", size: 15 }),
                    " Test draft"),
                React.createElement("button", { className: "button-primary", disabled: !compiled.ok, onClick: () => this.setState({ modal: '', pendingView: true }) },
                    "Review changes ",
                    React.createElement(Icon, { name: "arrow", size: 15 }))));
    }
    renderInvestigate() { const s = this.state; const dec = s.decisions.find((d) => d.id === s.selectedDecision) || s.decisions[0], a = this.findAgent(dec.agentId), u = this.findUser(dec.userId); const current = this.evaluate(dec.userId, dec.agentId, dec.toolId, dec.context || {}, false); const base = current.checks.slice(0, 4), extra = current.checks.slice(4); const shortNames = ['Identity', 'Relation', 'Capability', 'Tool review']; const steps = base.map((c, i) => ({ short: shortNames[i], label: c.label, detail: c.detail, state: c.ok ? 'good' : 'bad', planned: i !== 2 })).concat([extra.length ? { short: 'Context', label: 'Context conditions', detail: extra.map((c) => c.label + ' · ' + c.detail).join(' / '), state: extra.every((c) => c.ok) ? 'good' : 'bad', planned: false } : { short: 'Context', label: 'Context conditions', detail: 'Not defined', state: 'unset', planned: false }]); const page = s.decisionPage || 0, pages = Math.ceil(s.decisions.length / 6); const failed = steps.filter((st) => st.state === 'bad'), tl = this.findTool(dec.toolId); const same = s.decisions.filter((d) => d.toolId === dec.toolId && d.agentId === dec.agentId && d.result === dec.result).map((d) => d.time).sort(); const adjust = () => { this.go('workspace', { selectedAgent: dec.agentId, selectedUser: dec.userId, selectedTool: dec.toolId, section: 'capabilities', agentSearch: '', focusTool: dec.toolId, simResult: null }); setTimeout(() => { const el = document.querySelector('[data-tool="' + dec.toolId + '"]'); if (el)
        el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60); }; return React.createElement("div", { className: "detail-container page-fade" },
        React.createElement("div", { className: "detail-heading" },
            React.createElement("div", null,
                React.createElement("div", { className: "eyebrow" }, "INVESTIGATE / DECISIONS"),
                React.createElement("h1", null, "Descubra o motivo. N\u00E3o apenas o log."),
                React.createElement("p", null, "Inspecione decis\u00F5es hist\u00F3ricas, compare pol\u00EDticas e investigue o caminho de autoriza\u00E7\u00E3o.")),
            React.createElement("button", { className: "button-subtle", onClick: () => this.go('workspace', { selectedAgent: dec.agentId, selectedUser: dec.userId, selectedTool: dec.toolId, simResult: null }) },
                React.createElement(Icon, { name: "beaker", size: 16 }),
                " Open in workbench")),
        !s.decisionOpen ? React.createElement("div", { className: "decision-table" },
            React.createElement("div", { className: "context-warning decision-warning" },
                React.createElement(Icon, { name: "alert" }),
                React.createElement("div", null,
                    React.createElement("strong", null, "The system still records ALLOW decisions"),
                    React.createElement("span", null, "Chokepoint stores every allowed call, but nothing uses these records yet. They are shown here for now. They use storage and have no effect on signals or counters."))),
            React.createElement("div", { className: "decision-table-head" },
                React.createElement("span", { className: "section-kicker" }, "RECENT DECISIONS"),
                React.createElement("span", { className: "mono-soft" },
                    s.decisions.length,
                    " examples")),
            React.createElement("div", { className: "decision-columns" },
                React.createElement("span", null, "RESULT"),
                React.createElement("span", null, "AGENT"),
                React.createElement("span", null, "MCP SERVER / TOOL"),
                React.createElement("span", null, "PRINCIPAL"),
                React.createElement("span", null,
                    "CONTEXT",
                    React.createElement("span", { className: "planned-tag" }, "Planned \u00B7 2026-10-29")),
                React.createElement("span", null, "TIME"),
                React.createElement("span", null)),
            s.decisions.slice(page * 6, page * 6 + 6).map((d) => React.createElement("button", { key: d.id, className: "decision-trow", onClick: () => this.setState({ selectedDecision: d.id, decisionOpen: true }) },
                React.createElement("span", null,
                    React.createElement("span", { className: classNames('tiny-outcome', d.result ? 'tiny-allow' : 'tiny-deny') }, d.result ? 'ALLOW' : 'DENY'),
                    !d.result && (d.kind === 'tool_not_reviewed' || d.kind === 'user_disabled' ? React.createElement("small", { className: "dt-reason dt-reason--planned", tabIndex: 0, "data-tip": "Planned \u00B7 2026-10-29" }, d.kind === 'user_disabled' ? 'User disabled' : 'Tool not reviewed') : React.createElement("small", { className: "dt-reason" }, d.kind === 'condition' ? 'Condition' : 'No grant'))),
                React.createElement("span", { className: "dt-agent" },
                    this.findAgent(d.agentId).name,
                    React.createElement("small", { className: "dt-agent-id" }, d.agentId)),
                React.createElement("span", { className: "dt-tool" },
                    React.createElement("small", { className: "dt-server-line" }, this.findTool(d.toolId).server),
                    React.createElement("code", null, d.toolId),
                    (() => { const n = s.decisions.filter((x) => x.toolId === d.toolId && x.agentId === d.agentId && x.result === d.result).length; return n > 1 ? React.createElement("small", { className: "dt-repeat" },
                        "\u00D7",
                        n,
                        " in window") : null; })()),
                React.createElement("span", { className: "dt-user" }, this.findUser(d.userId).name),
                React.createElement("span", { className: "dt-context" }, d.context && Object.keys(d.context).length > 0 ? Object.entries(d.context).map(([k, v]) => k.split('.').slice(1).join('.') + ': ' + v).join(' · ') : ''),
                React.createElement("span", { className: "dt-time" },
                    "Oct 29 \u00B7 ",
                    d.time),
                React.createElement(Icon, { name: "chevron", size: 16 }))),
            React.createElement("div", { className: "decision-pager" },
                React.createElement("button", { className: "button-subtle", disabled: page === 0, onClick: () => this.setState({ decisionPage: page - 1 }) }, "Previous"),
                React.createElement("span", { className: "mono-soft" },
                    page + 1,
                    " / ",
                    pages),
                React.createElement("button", { className: "button-subtle", disabled: page >= pages - 1, onClick: () => this.setState({ decisionPage: page + 1 }) }, "Next"))) : React.createElement("div", { className: "decision-detail" },
            React.createElement("button", { className: "button-subtle decision-back", onClick: () => this.setState({ decisionOpen: false }) },
                React.createElement(Icon, { name: "arrow", size: 15 }),
                " All decisions"),
            React.createElement("div", { className: "trace-panel" },
                React.createElement("div", { className: "trace-head" },
                    React.createElement("div", { className: "section-kicker" }, "DECISION INSPECTOR"),
                    React.createElement("span", { className: "mono-soft" },
                        dec.id,
                        " \u00B7 ",
                        dec.time)),
                React.createElement("div", { className: "trace-title" },
                    React.createElement("span", { className: classNames('outcome-large', dec.result ? 'outcome-allow' : 'outcome-deny') },
                        React.createElement(Icon, { name: dec.result ? 'check' : 'x', size: 21 }),
                        dec.result ? 'Allowed' : 'Denied'),
                    React.createElement("h2", null, dec.toolId),
                    React.createElement("p", null, dec.reason)),
                React.createElement("div", { className: "auth-path", role: "list", "aria-label": "Authorization path" }, steps.map((st, i) => React.createElement("div", { key: i, className: "auth-step", role: "listitem", tabIndex: 0 },
                    React.createElement("span", { className: classNames('auth-dot', 'auth-' + st.state, st.planned && 'auth-planned') }),
                    React.createElement("span", { className: "auth-name" }, st.short),
                    i < steps.length - 1 && React.createElement("span", { className: "auth-line" }),
                    React.createElement("div", { className: "auth-tip", role: "tooltip" },
                        React.createElement("strong", null, st.label),
                        React.createElement("small", null, st.detail),
                        st.planned && React.createElement("span", { className: "planned-tag" }, "Planned \u00B7 2026-10-29"))))),
                React.createElement("div", { className: "trace-columns" },
                    React.createElement("div", null,
                        React.createElement("h3", null,
                            dec.result ? 'Rule that allowed' : 'Rule that denied',
                            dec.result && React.createElement("span", { className: "planned-tag" }, "Planned \u00B7 2026-10-29")),
                        React.createElement("p", null,
                            "Recorded reason: ",
                            dec.reason,
                            !dec.result && dec.reason !== 'Capability not granted' && React.createElement("span", { className: "planned-tag" }, "Planned \u00B7 2026-10-29")),
                        dec.result ? React.createElement("span", { className: "trace-status good" },
                            "Granted \u00B7 ",
                            a.name) : React.createElement("div", null, failed.length ? failed.map((st, i) => React.createElement("span", { key: i, className: "trace-status bad rule-chip" },
                            st.label,
                            ": ",
                            st.detail)) : React.createElement("span", { className: "trace-status bad" }, dec.reason)),
                        React.createElement("div", { className: "rule-action" },
                            React.createElement("button", { className: "button-dark", onClick: adjust },
                                "Adjust permissions ",
                                React.createElement(Icon, { name: "arrow", size: 15 })),
                            React.createElement("span", { className: "planned-tag" }, "Planned \u00B7 2026-10-29"))),
                    React.createElement("div", null,
                        React.createElement("h3", null, "Repeated in this window"),
                        React.createElement("p", null, "Same tool, same agent, same result."),
                        React.createElement("strong", { className: "repeat-count" },
                            same.length,
                            " ",
                            dec.result ? 'allowed' : 'denied'),
                        React.createElement("small", { className: "repeat-range" },
                            "Window ",
                            String(dec.time).slice(0, 2),
                            ":00\u2013",
                            String((Number(String(dec.time).slice(0, 2)) + 1) % 24).padStart(2, '0'),
                            ":00 UTC ",
                            React.createElement("span", { className: "planned-tag" }, "Planned \u00B7 2026-10-29")),
                        React.createElement("small", { className: "repeat-range" },
                            "First ",
                            same[0],
                            " \u00B7 Last ",
                            same[same.length - 1],
                            " UTC"))),
                React.createElement("div", { className: "trace-context" },
                    React.createElement("div", null,
                        React.createElement("small", null, "Principal"),
                        React.createElement("strong", null, u.name)),
                    React.createElement("div", null,
                        React.createElement("small", null, "Agent"),
                        React.createElement("strong", null, a.name),
                        React.createElement("span", { className: "mono-soft" },
                            "client_id: ",
                            dec.agentId)),
                    React.createElement("div", null,
                        React.createElement("small", null, "Tool"),
                        React.createElement("strong", null, dec.toolId)),
                    React.createElement("div", null,
                        React.createElement("small", null, "Server"),
                        React.createElement("strong", null, tl.server)),
                    React.createElement("div", null,
                        React.createElement("small", null, "Issuer"),
                        React.createElement("strong", null, "https://idp.acme.dev")),
                    React.createElement("div", null,
                        React.createElement("small", null, "Subject"),
                        React.createElement("strong", null, u.email)),
                    React.createElement("div", null,
                        React.createElement("small", null, "Decided at (UTC)"),
                        React.createElement("strong", null, dec.time)),
                    React.createElement("div", null,
                        React.createElement("small", null,
                            "Context ",
                            React.createElement("span", { className: "planned-tag" }, "Planned \u00B7 2026-10-29")),
                        React.createElement("strong", null, dec.context ? Object.entries(dec.context).map(([k, v]) => k.split('.').slice(1).join('.') + ': ' + v).join(' · ') : 'No recorded attributes')))))); }
    renderCatalog() { const s = this.state; const type = s.catalogType, search = s.catalogSearch.toLowerCase(), items = type === 'tools' ? s.tools.filter((t) => (t.id + ' ' + t.server + ' ' + t.description).toLowerCase().includes(search)) : type === 'people' ? s.users.filter((u) => (u.name + ' ' + u.email + ' ' + u.team).toLowerCase().includes(search)) : s.agents.filter((a) => (a.name + ' ' + a.description).toLowerCase().includes(search)); return React.createElement("div", { className: "detail-container catalog page-fade" },
        React.createElement("div", { className: "detail-heading" },
            React.createElement("div", null,
                React.createElement("div", { className: "eyebrow" }, "ACCESS / CATALOG"),
                React.createElement("h1", null, "Encontre qualquer coisa."),
                React.createElement("p", null, "Agents, users and capabilities in one searchable workspace.")),
            React.createElement("button", { className: "button-subtle", onClick: () => this.setState({ modal: type === 'agents' ? 'agent' : 'connection' }) },
                React.createElement(Icon, { name: "plus", size: 16 }),
                type === 'agents' ? 'New agent' : 'Add connection')),
        React.createElement("div", { className: "catalog-shell" },
            React.createElement("div", { className: "catalog-top" },
                React.createElement("div", { className: "catalog-tabs" }, [['tools', 'Tools'], ['agents', 'Agents'], ['people', 'People']].map((a) => React.createElement("button", { key: a[0], className: s.catalogType === a[0] ? 'catalog-tab-active' : '', onClick: () => this.setState({ catalogType: a[0], catalogSearch: '' }) }, a[1]))),
                React.createElement("div", { className: "field-search catalog-search" },
                    React.createElement(Icon, { name: "search", size: 16 }),
                    React.createElement("input", { placeholder: "Filter by name, type, server\u2026", value: s.catalogSearch, onChange: (e) => this.setState({ catalogSearch: e.target.value }) }))),
            React.createElement("div", { className: "catalog-columns" },
                React.createElement("span", null, type === 'people' ? 'IDENTITY' : type === 'agents' ? 'AGENT' : 'CAPABILITY'),
                React.createElement("span", null, type === 'tools' ? 'SERVER' : type === 'people' ? 'TEAM' : 'ENVIRONMENT'),
                React.createElement("span", null, type === 'tools' ? 'RISK' : type === 'people' ? 'STATUS' : 'STATUS'),
                React.createElement("span", null)),
            items.slice(0, 60).map((it) => { const isTool = type === 'tools'; const isPerson = type === 'people'; const unreviewed = isTool && it.approved === false && !s.reviewed; return React.createElement("button", { className: "catalog-row", key: it.id, onClick: () => { if (type === 'agents')
                    this.openItem('agent', it.id);
                else
                    this.setState({ selectedTool: isTool ? it.id : s.selectedTool, selectedUser: isPerson ? it.id : s.selectedUser, modal: isTool ? 'toolDetail' : 'userDetail' }); } },
                React.createElement("div", { className: "catalog-cell-main" },
                    React.createElement("span", { className: "catalog-symbol" },
                        React.createElement(Icon, { name: isTool ? 'code' : isPerson ? 'users' : 'zap', size: 17 })),
                    React.createElement("div", null,
                        React.createElement("strong", null, isTool ? it.id : it.name),
                        React.createElement("small", null, isTool ? it.description : isPerson ? it.email : it.description))),
                React.createElement("span", { className: "catalog-mid" }, isTool ? it.server : isPerson ? it.team : it.environment),
                React.createElement("span", null, unreviewed ? React.createElement("span", { className: "pill pill-warm" }, "Needs review") : React.createElement("span", { className: classNames('catalog-badge', isTool && it.risk === 'sensitive' && 'sensitive') }, isTool ? it.risk : isPerson ? it.status : it.status)),
                React.createElement(Icon, { name: "chevron", size: 16 })); }),
            !items.length && React.createElement("div", { className: "empty-result" }, "No matches. Try another search."))); }
    renderActivity() { return React.createElement("div", { className: "detail-container page-fade" },
        React.createElement("div", { className: "detail-heading" },
            React.createElement("div", null,
                React.createElement("div", { className: "eyebrow" }, "WORKSPACE / AUDIT"),
                React.createElement("h1", null,
                    "Changes, with context. ",
                    this.help("audit")),
                React.createElement("p", null, "Who published what, and when."))),
        React.createElement("div", { className: "audit-layout" },
            React.createElement("div", { className: "audit-history" },
                React.createElement("div", { className: "section-kicker" }, "PUBLICATION EVENTS"),
                this.state.history.map((h, i) => React.createElement("div", { className: "audit-event", key: i },
                    React.createElement("span", { className: "audit-bullet" },
                        React.createElement(Icon, { name: "check", size: 14 })),
                    React.createElement("div", null,
                        React.createElement("strong", null, h.description),
                        React.createElement("p", null, h.detail),
                        React.createElement("small", null, h.time)))),
                React.createElement("div", { className: "audit-event" },
                    React.createElement("span", { className: "audit-bullet neutral" },
                        React.createElement(Icon, { name: "link", size: 14 })),
                    React.createElement("div", null,
                        React.createElement("strong", null, "Identity provider linked"),
                        React.createElement("p", null, "OIDC \u00B7 Acme SSO"),
                        React.createElement("small", null, "3 days ago")))),
            React.createElement("aside", { className: "audit-side" },
                React.createElement(Icon, { name: "shield", size: 25 }),
                React.createElement("h3", null, "Audit trail"),
                React.createElement("p", null, "In production, these events would come from an append-only backend audit log with actor attribution. This prototype only tracks local demo changes."),
                React.createElement("button", { className: "button-subtle", onClick: () => this.go('investigate') },
                    "Investigate decisions ",
                    React.createElement(Icon, { name: "arrow", size: 15 }))))); }
    renderPalette() { const s = this.state; if (!s.paletteOpen)
        return null; return React.createElement("div", { className: "overlay", onClick: () => this.setState({ paletteOpen: false }) },
        React.createElement("div", { className: "command-modal", onClick: e => e.stopPropagation() },
            React.createElement("div", { className: "command-search" },
                React.createElement(Icon, { name: "search", size: 21 }),
                React.createElement("input", { autoFocus: true, placeholder: "Search agents, tools, users \u2014 or type a command", value: s.search, onChange: (e) => this.setState({ search: e.target.value }) }),
                React.createElement("kbd", null, "ESC")),
            React.createElement("div", { className: "command-results" },
                this.paletteItems().map((it, i) => React.createElement("button", { key: i, onClick: () => this.runPalette(it) },
                    React.createElement("span", { className: "cmd-icon" },
                        React.createElement(Icon, { name: it.type === 'agent' ? 'zap' : it.type === 'tool' ? 'code' : it.type === 'user' ? 'users' : 'arrow', size: 16 })),
                    React.createElement("span", null,
                        React.createElement("strong", null, it.name),
                        React.createElement("small", null, it.sub)),
                    React.createElement(Icon, { name: "arrow", size: 16 }))),
                this.paletteItems().length === 0 && React.createElement("div", { className: "empty-result" }, "Nothing found.")),
            React.createElement("div", { className: "command-bottom" },
                "Search first. No menu tree required. ",
                React.createElement("span", null, "Chokepoint \u00B7 Demo")))); }
    renderModal() {
        const s = this.state;
        const close = () => this.setState({ modal: '' });
        if (!s.modal)
            return null;
        const selectedTool = this.findTool(s.selectedTool), selectedUser = this.findUser(s.selectedUser);
        return React.createElement("div", { className: "overlay", onClick: close },
            React.createElement("div", { className: classNames("sheet-modal", s.modal === 'conditions' && 'rules-modal'), onClick: e => e.stopPropagation() },
                React.createElement("div", { className: "sheet-head" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "eyebrow" }, "CHOKEPOINT / ACTION"),
                        React.createElement("h2", null, s.modal === 'agent' ? 'Register an agent' : s.modal === 'editagent' ? 'Agent details' : s.modal === 'toolDetail' ? 'Capability details' : s.modal === 'userDetail' ? 'Identity and assignments' : s.modal === 'connection' ? 'Connect a MCP Server' : s.modal === 'conditions' ? 'Authorization rule · ' + this.findTool(s.conditionTool).id : 'Why this decision?')),
                    React.createElement("button", { className: "icon-button", onClick: close },
                        React.createElement(Icon, { name: "close" }))),
                s.modal === 'agent' && React.createElement("div", { className: "modal-body" },
                    React.createElement("p", null, "Create a logical agent type. A workload identity will be mapped to it during application integration."),
                    React.createElement("label", null, "Agent name"),
                    React.createElement("input", { placeholder: "e.g. Inventory Agent", value: s.agentForm.name, onChange: (e) => this.setState({ agentForm: { ...s.agentForm, name: e.target.value } }) }),
                    React.createElement("label", null, "Purpose"),
                    React.createElement("textarea", { placeholder: "What does this agent do?", value: s.agentForm.description, onChange: (e) => this.setState({ agentForm: { ...s.agentForm, description: e.target.value } }) }),
                    React.createElement("div", { className: "sheet-footer" },
                        React.createElement("button", { className: "button-subtle", onClick: close }, "Cancel"),
                        React.createElement("button", { className: "button-primary", disabled: !s.agentForm.name.trim(), onClick: () => { const name = s.agentForm.name.trim(), id = 'custom-' + Date.now(); this.setState((st) => ({ agents: st.agents.concat([{ id, name, description: st.agentForm.description || 'New agent type', environment: 'development', status: 'draft' }]), selectedAgent: id, agentForm: { name: '', description: '' }, modal: '', page: 'workspace', section: 'capabilities', toast: 'Agent created. Add people and capabilities.' })); } },
                            "Create agent ",
                            React.createElement(Icon, { name: "arrow", size: 15 })))),
                s.modal === 'editagent' && React.createElement("div", { className: "modal-body" },
                    React.createElement("p", null, "Agent type is a logical permission principal, not automatically a cryptographic workload identity."),
                    React.createElement("div", { className: "detail-property" },
                        React.createElement("small", null, "Name"),
                        React.createElement("strong", null, this.findAgent(s.selectedAgent).name)),
                    React.createElement("div", { className: "detail-property" },
                        React.createElement("small", null, "Environment"),
                        React.createElement("strong", null, this.findAgent(s.selectedAgent).environment)),
                    React.createElement("button", { className: "button-subtle", onClick: () => this.setState({ modal: '' }) }, "Close")),
                s.modal === 'toolDetail' && React.createElement("div", { className: "modal-body" },
                    React.createElement("div", { className: "tool-detail-block" },
                        React.createElement("code", null, selectedTool.id),
                        React.createElement("p", null, selectedTool.description),
                        React.createElement("div", { className: "detail-property" },
                            React.createElement("small", null, "MCP Server"),
                            React.createElement("strong", null, selectedTool.server)),
                        React.createElement("div", { className: "detail-property" },
                            React.createElement("small", null, "Risk annotation (demo)"),
                            React.createElement("strong", null, selectedTool.risk))),
                    selectedTool.approved === false && !s.reviewed ? React.createElement("div", null,
                        React.createElement("div", { className: "context-warning" },
                            React.createElement(Icon, { name: "alert" }),
                            React.createElement("span", null, "New tool discovered. Classify it before granting production access. MCP annotations are advisory, not security guarantees.")),
                        React.createElement("button", { className: "button-primary", onClick: () => { this.reviewTool(); close(); } },
                            "Mark reviewed ",
                            React.createElement(Icon, { name: "check", size: 15 }))) : React.createElement("div", null,
                        React.createElement("div", { className: "sheet-subhead" }, "Agents with this capability"),
                        s.agents.filter((a) => this.has('capability', a.id, selectedTool.id)).slice(0, 12).map((a) => React.createElement("button", { className: "mini-related", key: a.id, onClick: () => this.openItem('agent', a.id) },
                            a.name,
                            React.createElement(Icon, { name: "arrow", size: 14 }))),
                        React.createElement("button", { className: "button-subtle", onClick: () => this.go('workspace', { selectedAgent: s.selectedAgent, selectedTool: selectedTool.id }) }, "Manage access"),
                        React.createElement("button", { className: "button-dark", onClick: () => this.openConditions(s.selectedAgent, selectedTool.id) },
                            "Configure conditions ",
                            React.createElement(Icon, { name: "filter", size: 14 })))),
                s.modal === 'conditions' && this.renderConditionEditor(),
                s.modal === 'userDetail' && React.createElement("div", { className: "modal-body" },
                    React.createElement("div", { className: "identity-head" },
                        React.createElement("span", { className: "person-circle big" }, initials(selectedUser.name)),
                        React.createElement("div", null,
                            React.createElement("h3", null, selectedUser.name),
                            React.createElement("small", null, selectedUser.email)),
                        React.createElement("span", { className: selectedUser.status === 'active' ? 'catalog-badge' : 'danger-text' }, selectedUser.status)),
                    React.createElement("div", { className: "sheet-subhead" }, "Assigned agent types"),
                    s.agents.filter((a) => this.has('member', a.id, selectedUser.id)).map((a) => React.createElement("div", { className: "assigned-agent", key: a.id },
                        React.createElement("strong", null, a.name),
                        React.createElement("button", { className: "danger-action", onClick: () => this.stage('member', a.id, selectedUser.id, false) },
                            "Revoke ",
                            React.createElement(Icon, { name: "x", size: 13 })))),
                    React.createElement("p", { className: "helper-copy" }, "Revocations are staged until publication. Identity active status is supplied by the external IdP in production."),
                    s.issues.disabled && selectedUser.status === 'disabled' && React.createElement("button", { className: "button-subtle", onClick: () => this.setState((st) => ({ issues: { ...st.issues, disabled: false }, toast: 'Identity issue acknowledged. Publish relation changes to complete resolution.' })) }, "Acknowledge issue"),
                    React.createElement("button", { className: "button-dark", onClick: () => this.setState({ pendingView: true, modal: '' }) },
                        "Review changes ",
                        React.createElement(Icon, { name: "arrow", size: 15 }))),
                s.modal === 'connection' && React.createElement("div", { className: "modal-body" },
                    React.createElement("p", null,
                        "This prototype does not connect to MCP Servers. Production discovery requires valid credentials and an authorized ",
                        React.createElement("code", null, "tools/list"),
                        " call."),
                    React.createElement("label", null, "Server name"),
                    React.createElement("input", { value: s.connectForm.name, onChange: (e) => this.setState({ connectForm: { ...s.connectForm, name: e.target.value } }), placeholder: "My internal MCP" }),
                    React.createElement("label", null, "MCP Server URL"),
                    React.createElement("input", { value: s.connectForm.url, onChange: (e) => this.setState({ connectForm: { ...s.connectForm, url: e.target.value } }), placeholder: "https://mcp.example.com/mcp" }),
                    React.createElement("div", { className: "context-warning" },
                        React.createElement(Icon, { name: "shield" }),
                        " No external connection will be made from this demo."),
                    React.createElement("button", { className: "button-subtle", onClick: close }, "Close")),
                s.modal === 'path' && s.simResult && React.createElement("div", { className: "modal-body" },
                    React.createElement("p", null, "A focused explanation of how this evaluation reached its result. The full OpenFGA graph remains behind the scenes."),
                    React.createElement("div", { className: "path-nodes" },
                        React.createElement("div", { className: "path-node" },
                            React.createElement(Icon, { name: "users" }),
                            this.findUser(s.simResult.userId).name),
                        React.createElement("span", { className: "path-arrow" }, "\u2193"),
                        React.createElement("div", { className: "path-node" },
                            React.createElement(Icon, { name: "zap" }),
                            this.findAgent(s.simResult.agentId).name),
                        React.createElement("span", { className: "path-arrow" }, "\u2193"),
                        React.createElement("div", { className: "path-node" },
                            React.createElement(Icon, { name: "code" }),
                            s.simResult.toolId),
                        React.createElement("span", { className: classNames('path-result', s.simResult.allowed ? 'allow' : 'deny') }, s.simResult.allowed ? 'ALLOW' : 'DENY')),
                    React.createElement("div", { className: "trace-breakdown" }, s.simResult.checks.map((c, i) => React.createElement("div", { className: "breakdown-row", key: i },
                        React.createElement("span", { className: c.ok ? 'path-good' : 'path-bad' },
                            React.createElement(Icon, { name: c.ok ? 'check' : 'x', size: 14 })),
                        React.createElement("div", null,
                            React.createElement("strong", null, c.label),
                            React.createElement("small", null, c.detail))))))));
    }
    renderPublish() { const s = this.state; if (!s.pendingView)
        return null; const ruleChanges = Object.keys(s.policyDrafts); const invalidRules = ruleChanges.filter(k => !checkPolicy(s.policyDrafts[k], this.attributesForScope(parseScopeKey(k))).ok); const impacted = new Set(); ruleChanges.forEach(k => { const target = parseScopeKey(k); this.state.agents.filter((a) => !hasAgent(target.scope) || a.id === target.agentId).forEach((a) => this.state.users.filter((u) => this.has('member', a.id, u.id) && matchesScope(target, a.id, u, target.toolId || s.selectedTool)).forEach((u) => impacted.add(u.id))); }); s.pending.forEach((c) => { if (c.kind === 'member')
        impacted.add(c.targetId);
    else
        (s.members[c.agentId] || []).forEach((id) => impacted.add(id)); }); return React.createElement("div", { className: "overlay", onClick: () => this.setState({ pendingView: false }) },
        React.createElement("div", { className: "publish-modal", onClick: e => e.stopPropagation() },
            React.createElement("div", { className: "sheet-head" },
                React.createElement("div", null,
                    React.createElement("div", { className: "eyebrow" }, "POLICY CHANGESET"),
                    React.createElement("h2", null, "Review before publish")),
                React.createElement("button", { className: "icon-button", onClick: () => this.setState({ pendingView: false }) },
                    React.createElement(Icon, { name: "close" }))),
            React.createElement("div", { className: "publish-body" },
                React.createElement("div", { className: "review-summary" },
                    React.createElement("div", null,
                        React.createElement("strong", null, s.pending.length + ruleChanges.length),
                        React.createElement("small", null, "Unpublished changes")),
                    React.createElement("div", null,
                        React.createElement("strong", null, impacted.size),
                        React.createElement("small", null, "People potentially affected")),
                    React.createElement("div", null,
                        React.createElement("strong", null, new Set(s.pending.map((x) => x.agentId)).size),
                        React.createElement("small", null, "Agent types changed"))),
                React.createElement("p", { className: "helper-copy" }, "Impact is an estimate from the demo's direct relationships, not an exhaustive OpenFGA inheritance analysis."),
                React.createElement("div", { className: "regression-publish" },
                    React.createElement("strong", null,
                        "Regression gate \u00B7 ",
                        s.accessTests.length,
                        " saved tests"),
                    React.createElement("span", null, s.accessTests.length ? 'All saved expectations must pass with draft changes before publication.' : 'No regression tests saved yet. Save ALLOW/DENY expectations in the Evaluation Lab.'),
                    React.createElement("button", { className: "button-subtle", onClick: () => this.runTestSuite(true) }, "Run test suite"),
                    s.testSuiteResult && React.createElement("small", null,
                        s.testSuiteResult.passed,
                        " passed / ",
                        s.testSuiteResult.failed,
                        " failed")),
                invalidRules.length > 0 && React.createElement("div", { className: "cel-error" },
                    invalidRules.length,
                    " CEL rule(s) failed validation. Return to the editor before publishing."),
                React.createElement("div", { className: "changes-list" },
                    ruleChanges.map((k) => { var _a, _b; const target = parseScopeKey(k), p = s.policyDrafts[k]; return React.createElement("div", { className: "change-line", key: k },
                        React.createElement("span", { className: "change-action grant" }, "RULES"),
                        React.createElement("div", null,
                            React.createElement("strong", null, (_a = scopes.find(x => x.id === target.scope)) === null || _a === void 0 ? void 0 : _a.label),
                            React.createElement("small", null,
                                this.scopeSummary(target),
                                " \u00B7 ",
                                (p === null || p === void 0 ? void 0 : p.editor) === 'raw' ? 'CEL expression' : (((_b = p === null || p === void 0 ? void 0 : p.clauses) === null || _b === void 0 ? void 0 : _b.length) || 0) + ' conditions',
                                " ",
                                invalidRules.includes(k) ? '· Invalid syntax' : '')),
                        React.createElement("button", { className: "icon-button", title: "Discard rule changes", onClick: () => this.setState((st) => { const copy = { ...st.policyDrafts }; delete copy[k]; return { policyDrafts: copy }; }) },
                            React.createElement(Icon, { name: "close", size: 15 }))); }),
                    s.pending.map((c, i) => React.createElement("div", { className: "change-line", key: i },
                        React.createElement("span", { className: classNames('change-action', c.after ? 'grant' : 'revoke') }, c.after ? 'GRANT' : 'REVOKE'),
                        React.createElement("div", null,
                            React.createElement("strong", null, c.kind === 'member' ? this.findUser(c.targetId).name : c.targetId),
                            React.createElement("small", null,
                                this.findAgent(c.agentId).name,
                                " \u00B7 ",
                                c.kind === 'member' ? 'User association' : 'Tool capability')),
                        React.createElement("button", { className: "icon-button", title: "Discard change", onClick: () => this.setState((st) => ({ pending: st.pending.filter((_, j) => j !== i) })) },
                            React.createElement(Icon, { name: "close", size: 15 })))),
                    !s.pending.length && !ruleChanges.length && React.createElement("div", { className: "empty-result" }, "No unpublished changes. Select permissions to create a change set."))),
            React.createElement("div", { className: "publish-actions" },
                React.createElement("button", { className: "button-subtle", onClick: () => this.setState({ pendingView: false }) }, "Keep editing"),
                React.createElement("button", { className: "button-primary", disabled: (!s.pending.length && !ruleChanges.length) || invalidRules.length > 0, onClick: this.publish },
                    "Publish changes ",
                    React.createElement(Icon, { name: "arrow", size: 16 }))))); }
    render() { return React.createElement("div", { className: "app-shell" },
        this.renderTop(),
        React.createElement("main", null, this.state.page === 'home' ? this.renderHome() : this.state.page === 'workspace' ? this.renderWorkspace() : this.state.page === 'sources' ? this.renderSources() : this.state.page === 'investigate' ? this.renderInvestigate() : this.state.page === 'catalog' ? this.renderCatalog() : this.renderActivity()),
        (this.state.pending.length + Object.keys(this.state.policyDrafts).length) > 0 && React.createElement("div", { className: "floating-changes" },
            React.createElement("span", { className: "change-pulse" }),
            React.createElement("strong", null,
                this.state.pending.length + Object.keys(this.state.policyDrafts).length,
                " draft ",
                (this.state.pending.length + Object.keys(this.state.policyDrafts).length) === 1 ? 'change' : 'changes'),
            React.createElement("span", null, "Not published"),
            React.createElement("button", { onClick: () => this.setState({ pendingView: true }) },
                "Review ",
                React.createElement(Icon, { name: "arrow", size: 14 }))),
        this.state.toast && React.createElement("div", { className: "toast" },
            React.createElement(Icon, { name: "circlecheck", size: 17 }),
            this.state.toast,
            React.createElement("button", { onClick: this.clearToast },
                React.createElement(Icon, { name: "close", size: 14 }))),
        this.renderPalette(),
        this.renderModal(),
        this.renderPublish(),
        this.state.helpTopic && React.createElement("div", { className: "overlay", onClick: () => this.setState({ helpTopic: '' }) },
            React.createElement("div", { className: "sheet-modal help-detail-modal", role: "dialog", "aria-modal": "true", "aria-label": "Help", onClick: (e) => e.stopPropagation() },
                React.createElement("div", { className: "sheet-head" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "eyebrow" }, "CHOKEPOINT / FIELD GUIDE"),
                        React.createElement("h2", null, (HELP_TOPICS[this.state.helpTopic] || HELP_TOPICS.sources).title)),
                    React.createElement("button", { className: "icon-button", "aria-label": "Close help", onClick: () => this.setState({ helpTopic: '' }) },
                        React.createElement(Icon, { name: "close" }))),
                React.createElement("div", { className: "modal-body" },
                    React.createElement("p", null, (HELP_TOPICS[this.state.helpTopic] || HELP_TOPICS.sources).body),
                    React.createElement("ul", null, (HELP_TOPICS[this.state.helpTopic] || HELP_TOPICS.sources).details.map((d, i) => React.createElement("li", { key: i }, d))),
                    React.createElement("button", { className: "button-dark", onClick: () => this.setState({ helpTopic: '' }) }, "Entendi")))),
        React.createElement("footer", { className: "footer" },
            React.createElement("div", null,
                "Chokepoint ",
                React.createElement("span", { className: "footer-divider" }, "/"),
                " Authorization for agentic applications"),
            React.createElement("span", null, "Prototype \u00B7 Local simulated data"))); }
}
ReactDOM.render(React.createElement(App, null), document.getElementById('root'));
