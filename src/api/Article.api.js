import http from "../helpers/http";

const ArticleAPI = {
  get: ({ body, Token }) =>
    http.post(`/api/v3/Article25@get`, JSON.stringify(body), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  addEdit: ({ body, Token }) => {
    return http.post(`/api/v3/Article25@edit`, JSON.stringify(body), {
      headers: {
        Authorization: `Bearer ${Token}`,
        "Content-Type": "application/json",
      },
    });
  },
  delete: ({ body, Token }) =>
    http.post(`/api/v3/Article25@delete`, JSON.stringify(body), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  categories: ({ body, Token }) =>
    http.post(`/api/v3/cate25@get`, JSON.stringify(body), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  addEditCategory: ({ body, Token }) =>
    http.post(`/api/v3/cate25@edit`, JSON.stringify(body), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
};

export default ArticleAPI;
