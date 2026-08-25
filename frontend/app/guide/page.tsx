import { LeftFixedPanel } from "@/components/LeftFixedPanel";
import { RouteAnchor } from "@/components/RouteAnchor";
import "@/styles/guide.css";

export default function GuidePage() {
  return (
    <>
      <main className="split-box">
        <div className="left">
          <LeftFixedPanel compact />
        </div>

        <div className="right">
          <div className="wrap">
            <div className="title">
              <span className="bg-wrap">
                <h1 className="inn">Turn sound into visuals!</h1>
              </span>
              <span bg-wrap="">
                <p className="jp-sub inn">
                  <span>音を飾ろう!</span>
                </p>
              </span>
            </div>

            <section className="sec sec01">
              <div className="img-wrap">
                <img src="/image/image01.jpg" alt="music" />
                <div className="text t-01">
                  <p>お気に入りの楽曲も…</p>
                </div>
              </div>
            </section>

            <section className="sec sec02">
              <div className="img-wrap">
                <img src="/image/image02.jpg" alt="party" />
                <div className="text t-02">
                  <p>
                    大切な人からの
                    <br />
                    メッセージも…
                  </p>
                </div>
              </div>
            </section>

            <section className="sec sec03">
              <div className="img-wrap">
                <img src="/image/image03.jpg" alt="baby" />
                <div className="text t-03">
                  <p>赤ちゃんの初めての泣き声も…</p>
                </div>
              </div>
            </section>

            <section className="sec sec04">
              <div className="message">
                <h2>目に見える形に残してみませんか？</h2>
              </div>
            </section>

            <section className="sec sec05">
              <i className="fa-solid fa-circle-chevron-right" />
              <RouteAnchor href="/studio">ログイン</RouteAnchor>
              <i className="fa-solid fa-circle-chevron-right" />
              <RouteAnchor href="/features">機能</RouteAnchor>
            </section>

            <section className="sec sec06">
              <img src="/logo/Spectart-Logo.svg" className="logo" alt="logo" />
            </section>
          </div>
        </div>

        <footer />
      </main>
    </>
  );
}
