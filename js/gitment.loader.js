const gitment = new Gitment({
    owner: 'hanxiao',
    repo: 'hanxiao.github.io',
    oauth: {
        client_id: '3e2b8724bfc52b0ed18e',
        client_secret: 'b66489ca1688d6f123600d305ec158ffe7d2eea2'
    }
});
gitment.render('gitment_thread');