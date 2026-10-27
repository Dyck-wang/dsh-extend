import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseRebootInput, planReboot, type RebootEnvironment } from '../src/reboot/plan.ts'

const base: RebootEnvironment = {
  platform: 'win32',
  pid: 4656,
  ppid: 6328,
  desktopExecutable: 'D:\\Software\\dsh-desktop\\DeepSeek Harness.exe',
  execPath: 'D:\\Software\\dsh-desktop\\DeepSeek Harness.exe',
  runAsNode: true,
}

test('桌面端可重启', () => {
  const plan = planReboot(base)
  assert.equal(plan.ok, true)
  if (plan.ok) {
    assert.equal(plan.mainPid, 6328)
    assert.equal(plan.exeHint, base.desktopExecutable)
  }
})

test('非桌面端被拒绝', () => {
  const plan = planReboot({ ...base, runAsNode: false })
  assert.equal(plan.ok, false)
  if (!plan.ok) assert.match(plan.reason, /桌面端/u)
})

test('非 Windows 被拒绝', () => {
  assert.equal(planReboot({ ...base, platform: 'linux' }).ok, false)
})

test('父进程异常被拒绝', () => {
  assert.equal(planReboot({ ...base, ppid: 0 }).ok, false)
  assert.equal(planReboot({ ...base, ppid: base.pid }).ok, false)
})

test('缺少桌面 exe 提示时回退到 execPath', () => {
  const plan = planReboot({ ...base, desktopExecutable: undefined })
  assert.equal(plan.ok, true)
  if (plan.ok) assert.equal(plan.exeHint, base.execPath)
})

test('parseRebootInput', () => {
  // 默认即重启，等同于 --yes
  assert.equal(parseRebootInput('').mode, 'run')
  assert.equal(parseRebootInput('   ').mode, 'run')
  assert.equal(parseRebootInput('--yes').mode, 'run')
  assert.equal(parseRebootInput('--check').mode, 'check')
  const run = parseRebootInput('--yes --force')
  assert.equal(run.mode, 'run')
  assert.equal(run.force, true)
  assert.equal(parseRebootInput('--force').mode, 'run')
  assert.equal(parseRebootInput('--force').force, true)
  assert.equal(parseRebootInput('--help').mode, 'help')
  assert.ok(parseRebootInput('--check --yes').errors.length > 0)
  assert.ok(parseRebootInput('--check --force').errors.length > 0)
  assert.ok(parseRebootInput('--nope').errors.length > 0)
})
