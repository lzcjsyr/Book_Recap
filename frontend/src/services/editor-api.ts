/**
 * 编辑器相关API服务
 */
import axios, { AxiosInstance } from 'axios';

class EditorApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // ==================== 单个元素重新生成 ====================

  /**
   * 重新生成指定段落的图片
   */
  async regenerateSegmentImage(
    projectId: number,
    segmentIndex: number,
    customPrompt?: string
  ): Promise<any> {
    return this.client.post(
      `/editor/projects/${projectId}/segments/${segmentIndex}/regenerate-image`,
      { custom_prompt: customPrompt }
    );
  }

  /**
   * 重新生成指定段落的音频
   */
  async regenerateSegmentAudio(
    projectId: number,
    segmentIndex: number,
    customParams?: any
  ): Promise<any> {
    return this.client.post(
      `/editor/projects/${projectId}/segments/${segmentIndex}/regenerate-audio`,
      { custom_params: customParams }
    );
  }

  /**
   * 上传自定义图片
   */
  async uploadCustomImage(
    projectId: number,
    filename: string,
    file: File
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.client.post(
      `/editor/projects/${projectId}/images/${filename}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  // ==================== 数据编辑 ====================

  /**
   * 更新raw.json数据
   */
  async updateRawData(projectId: number, data: any): Promise<void> {
    return this.client.put(`/editor/projects/${projectId}/raw-data`, data);
  }

  /**
   * 更新script.json数据
   */
  async updateScriptData(projectId: number, data: any): Promise<void> {
    return this.client.put(`/editor/projects/${projectId}/script-data`, data);
  }

  // ==================== 版本控制 ====================

  /**
   * 获取raw.json历史版本
   */
  async getRawDataHistory(projectId: number): Promise<any> {
    const response = await this.client.get(
      `/editor/projects/${projectId}/history/raw-data`
    );
    return response.data.history;
  }

  /**
   * 获取script.json历史版本
   */
  async getScriptDataHistory(projectId: number): Promise<any> {
    const response = await this.client.get(
      `/editor/projects/${projectId}/history/script-data`
    );
    return response.data.history;
  }

  /**
   * 恢复raw.json到指定版本
   */
  async restoreRawDataVersion(
    projectId: number,
    version: number
  ): Promise<void> {
    return this.client.post(
      `/editor/projects/${projectId}/history/raw-data/restore/${version}`
    );
  }

  /**
   * 恢复script.json到指定版本
   */
  async restoreScriptDataVersion(
    projectId: number,
    version: number
  ): Promise<void> {
    return this.client.post(
      `/editor/projects/${projectId}/history/script-data/restore/${version}`
    );
  }

  // ==================== 分段操作 ====================

  /**
   * 合并多个段落
   */
  async mergeSegments(
    projectId: number,
    segmentIndices: number[]
  ): Promise<any> {
    return this.client.post(`/editor/projects/${projectId}/segments/merge`, {
      segment_indices: segmentIndices,
    });
  }

  /**
   * 拆分段落
   */
  async splitSegment(
    projectId: number,
    segmentIndex: number,
    splitPosition: number
  ): Promise<any> {
    return this.client.post(
      `/editor/projects/${projectId}/segments/${segmentIndex}/split`,
      { split_position: splitPosition }
    );
  }

  // ==================== 数据验证 ====================

  /**
   * 验证项目数据完整性
   */
  async validateProject(projectId: number): Promise<any> {
    return this.client.get(`/editor/projects/${projectId}/validate`);
  }
}

export const editorApiService = new EditorApiService();
export default editorApiService;
