/* ============================================================
   CUSTOCAFE – Frontend React (UMD build, no bundler required)
   ABC PRIME COMÉRCIO SERVIÇO TECNOLOGIA LTDA
   CNPJ: 23.360.116/0001-37
   ============================================================ */

'use strict';

const { useState, useEffect, createElement: h } = React;
const API = '/api';

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: API });
api.interceptors.request.use(cfg => {
    const token = localStorage.getItem('token');
    if (token) cfg.headers['Authorization'] = `Bearer ${token}`;
    return cfg;
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function Alert({ msg, type = 'error' }) {
    if (!msg) return null;
    return h('div', { className: `alert alert--${type}` }, msg);
}

function Spinner() {
    return h('div', { className: 'spinner' }, 'Carregando…');
}

// ── Login ─────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
    const [email, setEmail]   = useState('');
    const [senha, setSenha]   = useState('');
    const [error, setError]   = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, senha });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            onLogin(data.user);
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    }

    return h('div', { className: 'login-wrapper' },
        h('div', { className: 'login-card' },
            h('div', { className: 'login-logo' }, '☕'),
            h('h1', { className: 'login-title' }, 'CUSTOCAFE'),
            h('p', { className: 'login-subtitle' }, 'Sistema de Gestão de Custos Agrícolas'),
            h(Alert, { msg: error }),
            h('form', { onSubmit: handleSubmit, className: 'login-form' },
                h('label', null, 'E-mail'),
                h('input', {
                    type: 'email', value: email, required: true,
                    placeholder: 'seu@email.com',
                    onChange: e => setEmail(e.target.value)
                }),
                h('label', null, 'Senha'),
                h('input', {
                    type: 'password', value: senha, required: true,
                    placeholder: '••••••••',
                    onChange: e => setSenha(e.target.value)
                }),
                h('button', { type: 'submit', disabled: loading, className: 'btn btn--primary btn--full' },
                    loading ? 'Entrando…' : 'Entrar'
                )
            ),
            h('div', { className: 'pricing' },
                h('p', { className: 'pricing-title' }, 'Planos disponíveis'),
                h('div', { className: 'pricing-plans' },
                    h('div', { className: 'plan' }, h('strong', null, 'Básico'), h('span', null, 'R$29/mês')),
                    h('div', { className: 'plan plan--highlight' }, h('strong', null, 'Pro'), h('span', null, 'R$59/mês')),
                    h('div', { className: 'plan' }, h('strong', null, 'Premium'), h('span', null, 'R$99/mês'))
                )
            )
        )
    );
}

// ── Generic CRUD Table ────────────────────────────────────────────────────────
function CrudTable({ title, endpoint, columns, formFields, emptyRow }) {
    const [rows, setRows]       = useState([]);
    const [form, setForm]       = useState(emptyRow);
    const [editing, setEditing] = useState(null);
    const [error, setError]     = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    async function load() {
        setLoading(true);
        try {
            const { data } = await api.get(endpoint);
            setRows(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, [endpoint]);

    function flash(msg, type = 'success') {
        if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
        else { setError(msg); setTimeout(() => setError(''), 4000); }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        try {
            if (editing !== null) {
                await api.put(`${endpoint}/${editing}`, form);
                flash('Registro atualizado!');
            } else {
                await api.post(endpoint, form);
                flash('Registro criado!');
            }
            setForm(emptyRow);
            setEditing(null);
            load();
        } catch (err) {
            flash(err.response?.data?.error || 'Erro ao salvar', 'error');
        }
    }

    async function handleDelete(id) {
        if (!confirm('Confirmar exclusão?')) return;
        try {
            await api.delete(`${endpoint}/${id}`);
            flash('Registro removido!');
            load();
        } catch (err) {
            flash(err.response?.data?.error || 'Erro ao remover', 'error');
        }
    }

    function startEdit(row) {
        setEditing(row.id);
        const f = {};
        formFields.forEach(field => { f[field.key] = row[field.key] ?? ''; });
        setForm(f);
    }

    function cancelEdit() {
        setEditing(null);
        setForm(emptyRow);
    }

    return h('section', { className: 'crud-section' },
        h('h2', null, title),
        h(Alert, { msg: error }),
        h(Alert, { msg: success, type: 'success' }),

        // Form
        h('form', { onSubmit: handleSubmit, className: 'crud-form' },
            formFields.map(field =>
                h('div', { key: field.key, className: 'form-group' },
                    h('label', null, field.label),
                    h('input', {
                        type: field.type || 'text',
                        value: form[field.key] ?? '',
                        placeholder: field.placeholder || '',
                        required: field.required,
                        onChange: e => setForm({ ...form, [field.key]: e.target.value })
                    })
                )
            ),
            h('div', { className: 'form-actions' },
                h('button', { type: 'submit', className: 'btn btn--primary' },
                    editing !== null ? 'Atualizar' : 'Adicionar'
                ),
                editing !== null && h('button', {
                    type: 'button', className: 'btn btn--secondary', onClick: cancelEdit
                }, 'Cancelar')
            )
        ),

        // Table
        loading ? h(Spinner, null) :
        h('div', { className: 'table-wrapper' },
            h('table', null,
                h('thead', null,
                    h('tr', null,
                        columns.map(col => h('th', { key: col.key }, col.label)),
                        h('th', null, 'Ações')
                    )
                ),
                h('tbody', null,
                    rows.length === 0
                        ? h('tr', null, h('td', { colSpan: columns.length + 1, className: 'empty' }, 'Nenhum registro encontrado'))
                        : rows.map(row =>
                            h('tr', { key: row.id },
                                columns.map(col => h('td', { key: col.key }, row[col.key] ?? '—')),
                                h('td', null,
                                    h('button', { className: 'btn btn--sm btn--warning', onClick: () => startEdit(row) }, 'Editar'),
                                    ' ',
                                    h('button', { className: 'btn btn--sm btn--danger', onClick: () => handleDelete(row.id) }, 'Excluir')
                                )
                            )
                        )
                )
            )
        )
    );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ user, onLogout }) {
    const [tab, setTab] = useState('glebas');

    const tabs = [
        { key: 'glebas',        label: '🌾 Glebas' },
        { key: 'centro_custos', label: '💰 Centro de Custos' },
        { key: 'ordem_servicos', label: '🔧 Ordens de Serviço' },
    ];

    const sections = {
        glebas: h(CrudTable, {
            key: 'glebas',
            title: 'Glebas',
            endpoint: '/glebas',
            columns: [
                { key: 'id',            label: 'ID' },
                { key: 'nome',          label: 'Nome' },
                { key: 'setor_nome',    label: 'Setor' },
                { key: 'area_hectares', label: 'Área (ha)' },
            ],
            formFields: [
                { key: 'nome',          label: 'Nome',       required: true,  placeholder: 'Ex: Gleba A' },
                { key: 'area_hectares', label: 'Área (ha)',  type: 'number',  placeholder: '0.00' },
            ],
            emptyRow: { nome: '', area_hectares: '' }
        }),

        centro_custos: h(CrudTable, {
            key: 'centro_custos',
            title: 'Centro de Custos',
            endpoint: '/centro-custos',
            columns: [
                { key: 'id',             label: 'ID' },
                { key: 'descricao',      label: 'Descrição' },
                { key: 'valor',          label: 'Valor (R$)' },
                { key: 'data_lancamento', label: 'Data' },
            ],
            formFields: [
                { key: 'descricao',       label: 'Descrição', required: true, placeholder: 'Ex: Manutenção do Armazém' },
                { key: 'valor',           label: 'Valor (R$)', type: 'number', placeholder: '0.00' },
                { key: 'data_lancamento', label: 'Data',       type: 'date' },
            ],
            emptyRow: { descricao: '', valor: '', data_lancamento: '' }
        }),

        ordem_servicos: h(CrudTable, {
            key: 'ordem_servicos',
            title: 'Ordens de Serviço',
            endpoint: '/ordem-servicos',
            columns: [
                { key: 'id',          label: 'ID' },
                { key: 'descricao',   label: 'Descrição' },
                { key: 'valor',       label: 'Valor (R$)' },
                { key: 'gleba_nome',  label: 'Gleba' },
                { key: 'data_servico', label: 'Data' },
            ],
            formFields: [
                { key: 'descricao',   label: 'Descrição', required: true, placeholder: 'Ex: Colheita Gleba A' },
                { key: 'valor',       label: 'Valor (R$)', type: 'number', placeholder: '0.00' },
                { key: 'gleba_id',    label: 'ID da Gleba', type: 'number', placeholder: '1' },
                { key: 'data_servico', label: 'Data', type: 'date' },
            ],
            emptyRow: { descricao: '', valor: '', gleba_id: '', data_servico: '' }
        }),
    };

    return h('div', { className: 'dashboard' },
        h('header', { className: 'header' },
            h('div', { className: 'header-brand' },
                h('span', { className: 'header-logo' }, '☕'),
                h('span', { className: 'header-title' }, 'CUSTOCAFE')
            ),
            h('div', { className: 'header-user' },
                h('span', null, `Olá, ${user.nome}`),
                h('button', { className: 'btn btn--sm btn--secondary', onClick: onLogout }, 'Sair')
            )
        ),

        h('nav', { className: 'tab-nav' },
            tabs.map(t =>
                h('button', {
                    key: t.key,
                    className: `tab-btn ${tab === t.key ? 'tab-btn--active' : ''}`,
                    onClick: () => setTab(t.key)
                }, t.label)
            )
        ),

        h('main', { className: 'main-content' },
            sections[tab]
        ),

        h('footer', null,
            '© 2026 ABC PRIME COMÉRCIO SERVIÇO TECNOLOGIA LTDA – CNPJ: 23.360.116/0001-37'
        )
    );
}

// ── App root ──────────────────────────────────────────────────────────────────
function App() {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    });

    function handleLogin(u) { setUser(u); }

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    }

    return user
        ? h(Dashboard, { user, onLogout: handleLogout })
        : h(Login, { onLogin: handleLogin });
}

// ── Mount ─────────────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(h(App, null));
