/**
 * API服务封装
 */
import axios, { AxiosInstance } from 'axios';
import type {
  Project,
  Task,
  ProjectListResponse,
  TaskListResponse,
  CreateProjectData,
  ExecuteStepData,
  RegenerateImagesData,
} from '@/types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 可以在这里添加认证token等
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // ==================== 项目管理 ====================

  /**
   * 创建项目
   */
  async createProject(data: CreateProjectData): Promise<Project> {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) {
      formData.append('description', data.description);
    }
    formData.append('config', JSON.stringify(data.config));
    if (data.file) {
      formData.append('file', data.file);
    }

    return this.client.post('/projects/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * 获取项目列表
   */
  async getProjects(params?: {
    skip?: number;
    limit?: number;
    status_filter?: string;
  }): Promise<ProjectListResponse> {
    return this.client.get('/projects/', { params });
  }

  /**
   * 获取项目详情
   */
  async getProject(projectId: number): Promise<Project> {
    return this.client.get(`/projects/${projectId}`);
  }

  /**
   * 更新项目
   */
  async updateProject(
    projectId: number,
    data: Partial<CreateProjectData>
  ): Promise<Project> {
    return this.client.put(`/projects/${projectId}`, data);
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: number): Promise<void> {
    return this.client.delete(`/projects/${projectId}`);
  }

  /**
   * 获取项目文件
   */
  async getProjectFile(
    projectId: number,
    fileType: string
  ): Promise<{ content: string; file_type: string }> {
    return this.client.get(`/projects/${projectId}/files/${fileType}`);
  }

  /**
   * 更新项目文件
   */
  async updateProjectFile(
    projectId: number,
    fileType: string,
    content: string
  ): Promise<void> {
    return this.client.put(`/projects/${projectId}/files/${fileType}`, {
      content,
    });
  }

  /**
   * 获取项目图片列表
   */
  async getProjectImages(projectId: number): Promise<{ images: any[] }> {
    return this.client.get(`/projects/${projectId}/images`);
  }

  /**
   * 获取项目音频列表
   */
  async getProjectAudio(projectId: number): Promise<{ audio: any[] }> {
    return this.client.get(`/projects/${projectId}/audio`);
  }

  // ==================== 任务管理 ====================

  /**
   * 启动全自动模式
   */
  async startFullAuto(projectId: number): Promise<Task> {
    return this.client.post(`/tasks/projects/${projectId}/full-auto`);
  }

  /**
   * 执行单个步骤
   */
  async executeStep(
    projectId: number,
    data: ExecuteStepData
  ): Promise<Task> {
    return this.client.post(`/tasks/projects/${projectId}/step`, data);
  }

  /**
   * 重新生成图片
   */
  async regenerateImages(
    projectId: number,
    data: RegenerateImagesData
  ): Promise<Task> {
    return this.client.post(
      `/tasks/projects/${projectId}/regenerate-images`,
      data
    );
  }

  /**
   * 获取项目任务列表
   */
  async getProjectTasks(
    projectId: number,
    params?: { skip?: number; limit?: number }
  ): Promise<TaskListResponse> {
    return this.client.get(`/tasks/projects/${projectId}/tasks`, { params });
  }

  /**
   * 获取任务详情
   */
  async getTask(taskId: number): Promise<Task> {
    return this.client.get(`/tasks/${taskId}`);
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: number): Promise<void> {
    return this.client.post(`/tasks/${taskId}/cancel`);
  }

  // ==================== 文件服务 ====================

  /**
   * 获取图片URL
   */
  getImageUrl(projectId: number, filename: string): string {
    return `/api/files/${projectId}/images/${filename}`;
  }

  /**
   * 获取音频URL
   */
  getAudioUrl(projectId: number, filename: string): string {
    return `/api/files/${projectId}/audio/${filename}`;
  }

  /**
   * 获取视频URL
   */
  getVideoUrl(projectId: number): string {
    return `/api/files/${projectId}/video`;
  }

  /**
   * 获取封面URL
   */
  getCoverUrl(projectId: number, filename: string): string {
    return `/api/files/${projectId}/cover/${filename}`;
  }
}

export const apiService = new ApiService();
export default apiService;
