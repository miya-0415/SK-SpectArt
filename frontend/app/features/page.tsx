import { LeftFixedPanel } from "@/components/LeftFixedPanel";
import "@/styles/guide.css";
import "@/styles/features.css";

export default function FeaturesPage() {
  return (
    <>
      <main className="split-box">
        <div className="left">
          <LeftFixedPanel compact />
        </div>

        <div className="right">
          <div className="wrap">
            <h2>機能</h2>
            <i className="fa-solid fa-right-long" />

            <section className="sec sec2-01">
              <div className="sb-title">
                <span className="bg-wrap">
                  <h1 className="inn">1.Upload</h1>
                </span>
                <span bg-wrap="">
                  <p className="jp-sub inn">
                    <span>音を選ぶ</span>
                  </p>
                </span>
              </div>
              <div>
                <p>
                  お気に入りの楽曲や大切な人の声など、
                  <br />
                  あなたの「音」をアップロードしてください。
                </p>
                <img src="/image/upload.png" alt="音源アップロード画面" />
              </div>
            </section>

            <section className="sec sec2-01">
              <div className="sb-title">
                <span className="bg-wrap">
                  <h1 className="inn">2.Analyze</h1>
                </span>
                <span bg-wrap="">
                  <p className="jp-sub inn">
                    <span>解析</span>
                  </p>
                </span>
              </div>
              <div>
                <p>
                  独自のアルゴリズムが、音の中に秘められた感情や
                  <br />
                  揺らぎをリアルタイムに解析します。
                </p>
                <img src="/image/analyze.png" alt="音源アップロード画面" />
              </div>
            </section>

            <section className="sec sec2-01">
              <div className="sb-title">
                <span className="bg-wrap">
                  <h1 className="inn">3.Visualize</h1>
                </span>
                <span bg-wrap="">
                  <p className="jp-sub inn">
                    <span>アートへ変える</span>
                  </p>
                </span>
              </div>
              <div>
                <p>
                  解析されたデータは、世界にひとつだけの色彩と
                  <br />
                  有機的なグラフィックへと描き出されます。
                </p>
                <img src="/image/vizualize.png" alt="音源アップロード画面" />
              </div>
            </section>
          </div>

          <div className="scroll">
            <div className="scrollbar-text">
              <span>scroll</span>
            </div>
            <div className="scrollbar" />
          </div>
        </div>

        <footer />
      </main>
    </>
  );
}
