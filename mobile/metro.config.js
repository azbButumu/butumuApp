// リポジトリルートの shared/ を Web と共用するため、プロジェクト外のフォルダを監視対象に加える
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const repoRoot = path.resolve(projectRoot, '..')
const sharedRoot = path.resolve(repoRoot, 'shared')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [sharedRoot]
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')]
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@shared': sharedRoot,
}

module.exports = config
