/**
 * 新增修改完成调用 modalFormOk方法 编辑弹框组件ref定义为modalForm
 * 高级查询按钮调用 superQuery方法  高级查询组件ref定义为superQueryModal
 * data中url定义 list为查询列表  delete为删除单条记录  deleteBatch为批量删除
 */
import { filterObj } from '@/utils/util'
import { deleteAction, getAction } from '@/utils/ajax'
import storage from 'store'
import { ACCESS_TOKEN } from '@/store/mutation-types'

export const ProListMixin = {
  data () {
    return {
      // token header
      tokenHeader: {
        'X-Access-Token': storage.get(ACCESS_TOKEN)
      },
      /* 查询条件-请不要在queryParam中声明非字符串值的属性 */
      queryParam: {},
      /* 数据源 */
      dataSource: [],
      /* 分页参数 */
      ipagination: {
        current: 1,
        pageSize: 10,
        pageSizeOptions: ['10', '20', '30'],
        showTotal: (total, range) => {
          return range[0] + '-' + range[1] + ' 共' + total + '条'
        },
        showQuickJumper: true,
        showSizeChanger: true,
        total: 0
      },
      /* 排序参数 */
      isorter: {
        column: 'createTime',
        order: false // true -asc, false - desc
      },
      /* 筛选参数 */
      filters: {},
      /* table加载状态 */
      loading: false,
      /* table选中keys */
      selectedRowKeys: [],
      /* table选中records */
      selectionRows: [],
      /* 查询折叠 */
      toggleSearchStatus: false,
      /* 高级查询条件生效状态 */
      superQueryFlag: false,
      /* 高级查询条件 */
      superQueryParams: '',
      /* 内容窗口高度 */
      contentHeight: 400
    }
  },
  created () {
    this.loadData()
    // 初始化字典配置 在自己页面定义
    this.initDictConfig()
    // 初始化高度
  },
  methods: {
    loadData (arg) {
      if (!this.url.list) {
        this.$message.error('请设置url.list属性!')
        return
      }
      // 加载数据 若传入参数1则加载第一页的内容
      if (arg === 1) {
        this.ipagination.current = 1
      }
      const params = this.getQueryParams() // 查询条件
      this.loading = true
      getAction(this.url.list, params).then((res) => {
        if (this.$isAjaxSuccess(res.code)) {
          this.dataSource = res.result.records
          this.ipagination.total = res.result.total
        }
        if (res.code === 510) {
          this.$message.warning(res.message)
        }
        this.loading = false
      })
    },
    initDictConfig () {
      // console.log("--这是一个假的方法!")
    },
    handleSuperQuery (arg) {
      // 高级查询方法
      if (!arg) {
        this.superQueryParams = ''
        this.superQueryFlag = false
      } else {
        this.superQueryFlag = true
        this.superQueryParams = JSON.stringify(arg)
      }
      this.loadData()
    },
    getQueryParams () {
      // 获取查询条件
      const sqp = {}
      if (this.superQueryParams) {
        sqp['superQueryParams'] = encodeURI(this.superQueryParams)
      }
      const param = Object.assign(sqp, this.queryParam, this.isorter, this.filters)
      // param.field = this.getQueryField()
      param.pageNo = this.ipagination.current
      param.pageSize = this.ipagination.pageSize
      return filterObj(param)
    },
    getQueryField () {
      // TODO 字段权限控制
      let str = 'id,'
      this.columns.forEach(function (value) {
        str += ',' + value.dataIndex
      })
      return str
    },

    onSelectChange (selectedRowKeys, selectionRows) {
      this.selectedRowKeys = selectedRowKeys
      this.selectionRows = selectionRows
    },
    onClearSelected () {
      this.selectedRowKeys = []
      this.selectionRows = []
    },
    searchQuery () {
      this.loadData(1)
    },
    superQuery () {
      this.$refs.superQueryModal.show()
    },
    searchReset () {
      this.queryParam = {}
      this.loadData(1)
    },
    batchDel () {
      if (!this.url.deleteBatch) {
        return this.$message.error('请设置url.deleteBatch属性!')
      }
      if (this.selectedRowKeys.length <= 0) {
        return this.$message.warning('请选择一条记录！')
      } else {
        let ids = ''
        for (let a = 0; a < this.selectedRowKeys.length; a++) {
          ids += this.selectedRowKeys[a] + ','
        }
        const that = this
        this.$confirm({
          title: '确认删除',
          content: '是否删除选中数据?',
          onOk: function () {
            deleteAction(that.url.deleteBatch, {
              ids: ids
            }).then(res => {
              if (that.$isAjaxSuccess(res.code)) {
                that.$message.success(res.message)
                that.loadData()
                that.onClearSelected()
              } else {
                that.$message.warning(res.message)
              }
            })
          }
        })
      }
    },
    handleDelete (id) {
      if (!this.url.delete) {
        this.$message.error('请设置url.delete属性!')
        return
      }
      const that = this
      deleteAction(that.url.delete, {
        id: id
      }).then((res) => {
        if (this.$isAjaxSuccess(res.code)) {
          that.$message.success(res.message)
          that.loadData()
        } else {
          that.$message.warning(res.message)
        }
      })
    },
    handleEdit (record) {
      this.$refs.modalForm.edit(record)
      this.$refs.modalForm.title = '编辑'
      this.$refs.modalForm.disableSubmit = false
    },
    handleAdd () {
      this.$refs.modalForm.add()
      this.$refs.modalForm.title = '新增'
      this.$refs.modalForm.disableSubmit = false
    },
    handleTableChange (pagination, filters, sorter) {
      // 分页、排序、筛选变化时触发
      // TODO 筛选
      if (Object.keys(sorter).length > 0) {
        this.isorter.column = sorter.field
        this.isorter.order = sorter.order === 'ascend'
      }
      this.ipagination = pagination
      this.loadData()
    },
    handleToggleSearch () {
      this.toggleSearchStatus = !this.toggleSearchStatus
    },
    modalFormOk () {
      // 新增/修改 成功时，重载列表
      this.loadData()
    },
    handleDetail (record) {
      this.$refs.modalForm.edit(record)
      this.$refs.modalForm.title = '详情'
      this.$refs.modalForm.disableSubmit = true
    },
    /* 导出 */
    handleExportXls2 () {
      const paramsStr = encodeURI(JSON.stringify(this.getQueryParams()))
      const url = `/${this.url.exportXlsUrl}?paramsStr=${paramsStr}`
      window.location.href = url
    },
    handleExportXls (fileName) {
      if (!fileName || typeof fileName !== 'string') {
        fileName = '导出文件'
      }
      const param = {
        ...this.queryParam
      }
      if (this.selectedRowKeys && this.selectedRowKeys.length > 0) {
        param['selections'] = this.selectedRowKeys.join(',')
      }
      console.log('导出参数', param)
      // downFile(this.url.exportXlsUrl, param).then((data) => {
      //   if (!data) {
      //     this.$message.warning("文件下载失败")
      //     return
      //   }
      //   if (typeof window.navigator.msSaveBlob !== 'undefined') {
      //     window.navigator.msSaveBlob(new Blob([data]), fileName + '.xls')
      //   } else {
      //     let url = window.URL.createObjectURL(new Blob([data]))
      //     let link = document.createElement('a')
      //     link.style.display = 'none'
      //     link.href = url
      //     link.setAttribute('download', fileName + '.xls')
      //     document.body.appendChild(link)
      //     link.click()
      //     document.body.removeChild(link); //下载完成移除元素
      //     window.URL.revokeObjectURL(url); //释放掉blob对象
      //   }
      // })
    },
    /* 导入 */
    handleImportExcel (info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList)
      }
      if (info.file.status === 'done') {
        if (info.file.response.success) {
          this.$message.success(`${info.file.name} 文件上传成功`)
          this.loadData()
        } else {
          this.$message.error(`${info.file.name} ${info.file.response.message}.`)
        }
      } else if (info.file.status === 'error') {
        this.$message.error(`文件上传失败: ${info.file.msg} `)
      }
    },
    /* 图片预览 */
    getImgView (text) {
      if (text && text.indexOf(',') > 0) {
        text = text.substring(0, text.indexOf(','))
      }
      return '/' + text
    },
    /* 文件下载 */
    downloadFile (text) {
      if (!text) {
        this.$message.warning('未知的文件')
        return
      }
      if (text.indexOf(',') > 0) {
        text = text.substring(0, text.indexOf(','))
      }
      window.open('/sys/common/download/' + text)
    },
    calculateContentHeight () {
      this.contentHeight = document.body.clientHeight - 64 - 40 - 85 /* search */ - 48 /* margin */ - 48 /* padding */
    },
    // 页面刷新
    pageReload () {
      this.$store.dispatch('ToggleMultiTab', false)
      this.$store.dispatch('SetReloadFlag', false)
      this.$nextTick(() => {
        this.$store.dispatch('ToggleMultiTab', true)
        this.$store.dispatch('SetReloadFlag', true)
      })
    }
  }
}