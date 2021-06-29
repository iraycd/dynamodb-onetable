/*
    Transactions
 */

import {AWS, Client, Table, print, dump, delay} from './utils/init'
import {DefaultSchema} from './schemas'

const table = new Table({
    name: 'TransactTest',
    client: Client,
    schema: DefaultSchema,
})
const User = table.getModel('User')
let user: any
let users: any[]

let data = [
    {name: 'Peter Smith', email: 'peter@example.com', status: 'active' },
    {name: 'Patty O\'Furniture', email: 'patty@example.com', status: 'active' },
    {name: 'Cu Later', email: 'cu@example.com', status: 'inactive' },
]

test('Create', async() => {
    if (!(await table.exists())) {
        await table.createTable()
    }
})

test('Transaction create', async() => {
    let transaction = {}
    for (let item of data) {
        table.create('User', item, {transaction})
    }
    await table.transact('write', transaction, {parse: true, hidden: false})

    users = await table.scan('User')
    expect(users.length).toBe(data.length)
})

test('Transaction get', async() => {
    let transaction = {}
    for (let user of users) {
        table.get('User', {id: user.id}, {transaction})
    }
    let items:any = await table.transact('get', transaction, {parse: true, hidden: false})
    expect(items.length).toBe(data.length)

    for (let item of items) {
        let datum = data.find(i => i.name == item.name)
        expect(item).toMatchObject(datum)
    }
})

test('Transaction update', async() => {
    let transaction = {}
    for (let user of users) {
        table.update('User', {id: user.id, status: 'offline'}, {transaction})
    }
    await table.transact('write', transaction, {parse: true, hidden: false})

    users = await table.scan('User')
    expect(users.length).toBe(data.length)
    for (let user of users) {
        expect(user.status).toBe('offline')
    }
    let grouped: any = table.groupByType(users)
    expect(grouped.User.length).toBe(3)
})

test('Destroy', async() => {
    await table.deleteTable('DeleteTableForever')
})